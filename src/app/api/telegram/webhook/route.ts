/**
 * Webhook de Telegram para Noé.
 *
 * Seguridad: valida el header `X-Telegram-Bot-Api-Secret-Token` contra
 * `TELEGRAM_WEBHOOK_SECRET`. Telegram envía este header en cada update
 * cuando se registra el webhook con `secret_token`.
 *
 * Registro del webhook (one-shot tras deploy):
 *   node scripts/register-telegram-webhook.mjs
 *
 * Comandos soportados en esta iteración:
 *   /start [token]   — vincular (deep-link web) o mensaje de bienvenida
 *   /vincular        — iniciar flujo de vinculación con DNI + OTP
 *   /desvincular     — dejar de recibir mensajes
 *   /ayuda           — mostrar comandos
 *
 * Mensajes libres durante el flujo /vincular se interpretan como DNI o código OTP
 * según el step actual almacenado en telegram_link_tokens.
 */
import { NextRequest, NextResponse } from "next/server";
import { type Part } from "@google/generative-ai";
import { getBot } from "@/lib/telegram/client";
import {
  buildDoctorLinkConfirmation,
  buildHelpMessage,
  buildLinkConfirmation,
  buildWelcomeMessage,
} from "@/lib/telegram/templates";
import {
  clearActiveFlowTokens,
  consumeWebLinkToken,
  getFlowStep,
  startTelegramLinkFlow,
  submitDni,
  unlinkByChatId,
  verifyOtpAndLink,
} from "@/lib/telegram/link-tokens";
import { sendEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAssistantModel } from "@/lib/ai/gemini-client";
import { buildDoctorTelegramPrompt } from "@/lib/ai/prompts-telegram-doctor";
import {
  DOCTOR_TOOL_DECLARATIONS,
  executeDoctorToolCall,
  type DoctorToolContext,
} from "@/lib/ai/tools-doctor";

const MAX_DOCTOR_TURNS = 6;

/**
 * Procesa un mensaje libre de un doctor vinculado vía IA Noé Doctor.
 * El doctorId se fija desde el chat vinculado para que el modelo NO pueda
 * verlo manipular (privacy entre doctores).
 *
 * Single-turn: cada mensaje es una conversación independiente. Telegram
 * ya muestra el historial visualmente, no necesitamos persistirlo en BD.
 */
async function handleDoctorAIMessage(params: {
  doctorId: string;
  doctorFirstName: string;
  userMessage: string;
}): Promise<string> {
  const todayISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
  }).format(new Date());
  const todayFormatted = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const systemInstruction = buildDoctorTelegramPrompt({
    todayFormatted,
    todayISO,
    doctorFirstName: params.doctorFirstName,
  });

  const model = getAssistantModel({
    systemInstruction,
    tools: DOCTOR_TOOL_DECLARATIONS,
  });
  const chat = model.startChat({ history: [] });

  const ctx: DoctorToolContext = { doctorId: params.doctorId };
  let parts: Part[] | string = params.userMessage;

  for (let i = 0; i < MAX_DOCTOR_TURNS; i++) {
    const result = await chat.sendMessage(parts);
    const response = result.response;
    const fnCalls = response.functionCalls();
    const text = response.text();

    if (!fnCalls || fnCalls.length === 0) {
      return text && text.trim().length > 0
        ? text
        : "No pude procesar esa consulta. ¿Puedes reformularla?";
    }

    const toolResults: Part[] = [];
    for (const call of fnCalls) {
      const r = await executeDoctorToolCall(call.name, call.args, ctx);
      toolResults.push({
        functionResponse: { name: call.name, response: r as object },
      });
    }
    parts = toolResults;
  }

  return "Tu consulta es muy compleja. Para detalles, ingresa al panel admin.";
}

/**
 * Si un chat_id ya está vinculado activamente (doctor o paciente),
 * devuelve el tipo. Permite cortar el flujo /vincular antes de pedir DNI
 * a alguien que ya está vinculado (ej. la Dra. Sonia escribiendo texto
 * libre — no debe ser tratada como paciente nuevo).
 */
interface ActiveLink {
  type: "doctor" | "patient";
  firstName: string | null;
  doctorId?: string;
  patientId?: string;
}

async function getActiveLink(chatId: number): Promise<ActiveLink | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("telegram_users")
    .select(
      "linked_entity_type, doctor_id, patient_id, doctor:doctors(profile:profiles(first_name)), patient:patients(first_name)"
    )
    .eq("telegram_chat_id", chatId)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return null;
  const type = data.linked_entity_type as "doctor" | "patient" | null;
  if (!type) return null;
  if (type === "doctor") {
    const doctor = data.doctor as unknown as
      | { profile: { first_name: string } | null }
      | null;
    return {
      type,
      firstName: doctor?.profile?.first_name ?? null,
      doctorId: data.doctor_id as string,
    };
  }
  const patient = data.patient as unknown as { first_name: string } | null;
  return {
    type,
    firstName: patient?.first_name ?? null,
    patientId: data.patient_id as string,
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Registrar los handlers una única vez por cold start
let handlersRegistered = false;

function registerHandlers() {
  if (handlersRegistered) return;
  handlersRegistered = true;
  const bot = getBot();

  bot.command("start", async (ctx) => {
    const chatId = ctx.chat.id;
    const payload = ctx.match?.trim();
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;

    if (payload) {
      // Deep-link: /start <token>
      const result = await consumeWebLinkToken(payload, chatId, username, firstName);
      if (result.ok) {
        const text =
          result.role === "doctor"
            ? buildDoctorLinkConfirmation(result.firstName)
            : buildLinkConfirmation(result.firstName);
        await ctx.reply(text, { parse_mode: "MarkdownV2" });
      } else {
        await ctx.reply(
          `No pude vincular tu cuenta: ${result.reason}. Escribe /vincular para intentarlo con tu DNI.`
        );
      }
      return;
    }
    await ctx.reply(buildWelcomeMessage(firstName), { parse_mode: "MarkdownV2" });
  });

  bot.command(["vincular", "link"], async (ctx) => {
    const chatId = ctx.chat.id;
    // Si el chat ya está vinculado activamente, NO iniciar flujo /vincular.
    const existing = await getActiveLink(chatId);
    if (existing) {
      const greet = existing.firstName ? `, ${existing.firstName}` : "";
      const role = existing.type === "doctor" ? "doctor(a)" : "paciente";
      await ctx.reply(
        `Ya estás vinculado${greet} como ${role}. Si quieres cambiar de cuenta, escribe /desvincular primero.`
      );
      return;
    }
    await startTelegramLinkFlow(chatId);
    await ctx.reply(
      "Para vincular tu cuenta, envíame tu *DNI* \\(8 dígitos\\)\\.",
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.command(["desvincular", "unlink"], async (ctx) => {
    const ok = await unlinkByChatId(ctx.chat.id);
    await ctx.reply(
      ok
        ? "Listo, ya no recibirás mensajes. Vuelve cuando quieras con /vincular."
        : "No encontré una cuenta vinculada a este chat."
    );
  });

  bot.command(["ayuda", "help"], async (ctx) => {
    await ctx.reply(buildHelpMessage(), { parse_mode: "MarkdownV2" });
  });

  // Mensajes de texto libre → interpretarlos según el step del flujo
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text?.trim();
    if (!text || text.startsWith("/")) return;
    const chatId = ctx.chat.id;

    // PRIORIDAD #1: si el chat ya está vinculado, NO interpretar como paciente
    // intentando dar DNI. Bug detectado en v1.1: la Dra. Sonia ya vinculada
    // como doctora recibía "El DNI debe tener 8 dígitos" cada vez que escribía
    // texto libre, porque un /vincular previo dejó un token con awaiting_dni
    // y el handler entraba en ese flujo sin verificar si ya estaba vinculada.
    const existing = await getActiveLink(chatId);
    if (existing) {
      // Limpieza de tokens huérfanos del flujo /vincular para que no vuelvan
      // a confundir si el usuario escribe algo en otro turno.
      await clearActiveFlowTokens(chatId);

      if (existing.type === "doctor" && existing.doctorId) {
        // v1.2: en lugar del mensaje fijo (bloqueo), invocamos a IA Noé Doctor.
        // Modelo de Gemini con prompt + tools de SOLO LECTURA (consulta de
        // agenda y pacientes propios). Privacidad entre doctores garantizada
        // porque el doctorId se fija aquí desde la tabla telegram_users.
        try {
          const aiText = await handleDoctorAIMessage({
            doctorId: existing.doctorId,
            doctorFirstName: existing.firstName ?? "doctor",
            userMessage: text,
          });
          await ctx.reply(aiText);
        } catch (err) {
          console.error("[telegram doctor AI]", err);
          await ctx.reply(
            "Tuve un problema procesando tu consulta. Intenta de nuevo en un momento."
          );
        }
        return;
      }

      // Paciente vinculado: por ahora se mantiene el mensaje informativo.
      // Una futura iteración podría darle también IA limitada (consultar su
      // próxima cita, etc.) — fuera del alcance de v1.2.
      const greet = existing.firstName ? `, ${existing.firstName}` : "";
      await ctx.reply(
        `Hola${greet} 👋. Por aquí solo te envío recordatorios de tus citas en Clínica Arca.\n\nPara agendar una nueva cita, escríbenos por el chat de la web (clinicaarca.com) o llama a recepción.\n\nEscribe /ayuda para ver mis comandos.`
      );
      return;
    }

    const step = await getFlowStep(chatId);

    if (step === "awaiting_dni") {
      const result = await submitDni(chatId, text);
      if (!result.ok) {
        await ctx.reply(result.reason);
        return;
      }
      // Enviar el OTP por email al paciente
      try {
        await sendEmail({
          to: result.email,
          subject: "Código de vinculación Telegram — Clínica Arca",
          html: `<p>Tu código de vinculación es: <strong style="font-size:24px;">${result.otp}</strong></p><p>Expira en 10 minutos. Si no solicitaste este código, ignora este correo.</p>`,
        });
      } catch (err) {
        console.error("[telegram] Error enviando OTP email:", err);
        await ctx.reply(
          "No pude enviarte el código por email. Intenta /vincular nuevamente en unos minutos."
        );
        return;
      }
      const masked = maskEmail(result.email);
      await ctx.reply(
        `Te envié un código de 6 dígitos a *${escapeMd(masked)}*\\. Respóndeme con el código para confirmar\\.`,
        { parse_mode: "MarkdownV2" }
      );
      return;
    }

    if (step === "awaiting_otp") {
      const result = await verifyOtpAndLink(
        chatId,
        text,
        ctx.from?.username,
        ctx.from?.first_name
      );
      if (!result.ok) {
        await ctx.reply(result.reason);
        return;
      }
      await ctx.reply(buildLinkConfirmation(result.patientFirstName), {
        parse_mode: "MarkdownV2",
      });
      return;
    }

    await ctx.reply(
      "Por ahora solo acepto comandos. Escribe /vincular para conectar tu cuenta o /ayuda para ver qué puedo hacer."
    );
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

function escapeMd(text: string): string {
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, (m) => `\\${m}`);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "TELEGRAM_WEBHOOK_SECRET no configurado" },
      { status: 500 }
    );
  }
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    registerHandlers();
    const update = await req.json();

    // Logging para diagnóstico — ayuda a confirmar que los updates llegan
    // y que el comando /start con token se está recibiendo bien.
    const msg = update?.message;
    if (msg) {
      const text = (msg.text as string | undefined) ?? "";
      const summary = text.startsWith("/start ")
        ? `/start with token (len=${text.length - 7})`
        : text.slice(0, 30);
      console.log(
        `[telegram webhook] update from chat=${msg.chat?.id} user=${msg.from?.username ?? msg.from?.first_name} text=${JSON.stringify(summary)}`
      );
    }

    const bot = getBot();
    // grammy en serverless puede dejar botInfo sin inicializar. Sin botInfo
    // los matchers de comandos pueden no resolver correctamente. init() es
    // idempotente: si ya está inicializado, no hace una nueva llamada.
    await bot.init();
    await bot.handleUpdate(update);
    console.log("[telegram webhook] update handled OK");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram webhook] ERROR handling update:", err);
    // Telegram reenvía updates si respondemos 5xx. Devolvemos 200 para evitar loops.
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
