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
import { getBot } from "@/lib/telegram/client";
import {
  buildHelpMessage,
  buildLinkConfirmation,
  buildWelcomeMessage,
} from "@/lib/telegram/templates";
import {
  consumeWebLinkToken,
  getFlowStep,
  startTelegramLinkFlow,
  submitDni,
  unlinkByChatId,
  verifyOtpAndLink,
} from "@/lib/telegram/link-tokens";
import { sendEmail } from "@/lib/email/send-email";

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
        await ctx.reply(buildLinkConfirmation(result.patientFirstName), {
          parse_mode: "MarkdownV2",
        });
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
    await startTelegramLinkFlow(ctx.chat.id);
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
    await getBot().handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram webhook]", err);
    // Telegram reenvía updates si respondemos 5xx. Devolvemos 200 para evitar loops.
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
