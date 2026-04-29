/**
 * Manejo de tokens de vinculación Telegram.
 *
 * Dos flujos:
 *  1. Deep-link web:
 *     - `createWebLinkToken(patientId)` crea un token asociado a un paciente.
 *     - El usuario recibe t.me/<bot>?start=<token>.
 *     - `consumeWebLinkToken(token, chatId)` lo valida y vincula.
 *
 *  2. Flujo /vincular desde Telegram:
 *     - `startTelegramLinkFlow(chatId)` crea un token step=awaiting_dni.
 *     - `submitDni(chatId, dni)` valida DNI, envía OTP por email, avanza a awaiting_otp.
 *     - `verifyOtpAndLink(chatId, code)` verifica y crea telegram_users.
 */
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_TTL_MIN = 15;
const OTP_TTL_MIN = 10;

export function generateToken(): string {
  return randomBytes(16).toString("base64url");
}

function expiresAt(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

// ------------------------------------------------------------
// Flujo 1 — deep-link web
// ------------------------------------------------------------

export async function createWebLinkToken(patientId: string): Promise<string> {
  const supabase = createAdminClient();
  const token = generateToken();
  const { error } = await supabase.from("telegram_link_tokens").insert({
    token,
    patient_id: patientId,
    link_role: "patient",
    step: "pending",
    expires_at: expiresAt(TOKEN_TTL_MIN),
  });
  if (error) throw new Error(`No se pudo crear token: ${error.message}`);
  return token;
}

export async function createWebLinkTokenForDoctor(
  doctorId: string
): Promise<string> {
  const supabase = createAdminClient();
  const token = generateToken();
  const { error } = await supabase.from("telegram_link_tokens").insert({
    token,
    doctor_id: doctorId,
    link_role: "doctor",
    step: "pending",
    expires_at: expiresAt(TOKEN_TTL_MIN),
  });
  if (error) throw new Error(`No se pudo crear token: ${error.message}`);
  return token;
}

type ConsumeResult =
  | { ok: true; role: "patient"; patientId: string; firstName: string }
  | { ok: true; role: "doctor"; doctorId: string; firstName: string }
  | { ok: false; reason: string };

export async function consumeWebLinkToken(
  token: string,
  chatId: number,
  telegramUsername?: string,
  telegramFirstName?: string
): Promise<ConsumeResult> {
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("telegram_link_tokens")
    .select("token, patient_id, doctor_id, link_role, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();
  if (!row) return { ok: false, reason: "Token inválido" };
  if (row.used_at) return { ok: false, reason: "Token ya utilizado" };
  if (new Date(row.expires_at).getTime() < Date.now())
    return { ok: false, reason: "Token expirado" };

  if (row.link_role === "doctor") {
    if (!row.doctor_id) return { ok: false, reason: "Token sin doctor asignado" };

    const { data: doctor } = await supabase
      .from("doctors")
      .select("id, profile:profiles(first_name)")
      .eq("id", row.doctor_id)
      .maybeSingle();
    const profile = (doctor as unknown as {
      profile: { first_name: string } | null;
    } | null)?.profile;
    if (!doctor || !profile) return { ok: false, reason: "Doctor no encontrado" };

    const { error: upsertErr } = await supabase
      .from("telegram_users")
      .upsert(
        {
          telegram_chat_id: chatId,
          telegram_username: telegramUsername ?? null,
          telegram_first_name: telegramFirstName ?? null,
          linked_entity_type: "doctor",
          patient_id: null,
          doctor_id: row.doctor_id,
          status: "active",
          linked_at: new Date().toISOString(),
        },
        { onConflict: "telegram_chat_id" }
      );
    if (upsertErr) return { ok: false, reason: upsertErr.message };

    await supabase
      .from("telegram_link_tokens")
      .update({ used_at: new Date().toISOString(), step: "consumed" })
      .eq("token", token);

    return {
      ok: true,
      role: "doctor",
      doctorId: row.doctor_id,
      firstName: profile.first_name,
    };
  }

  // link_role = 'patient'
  if (!row.patient_id) return { ok: false, reason: "Token inválido" };

  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name")
    .eq("id", row.patient_id)
    .maybeSingle();
  if (!patient) return { ok: false, reason: "Paciente no encontrado" };

  const { error: upsertErr } = await supabase
    .from("telegram_users")
    .upsert(
      {
        telegram_chat_id: chatId,
        telegram_username: telegramUsername ?? null,
        telegram_first_name: telegramFirstName ?? null,
        linked_entity_type: "patient",
        patient_id: patient.id,
        doctor_id: null,
        status: "active",
        linked_at: new Date().toISOString(),
      },
      { onConflict: "telegram_chat_id" }
    );
  if (upsertErr) return { ok: false, reason: upsertErr.message };

  await supabase
    .from("telegram_link_tokens")
    .update({ used_at: new Date().toISOString(), step: "consumed" })
    .eq("token", token);

  return {
    ok: true,
    role: "patient",
    patientId: patient.id,
    firstName: patient.first_name,
  };
}

// ------------------------------------------------------------
// Flujo 2 — /vincular desde Telegram
// ------------------------------------------------------------

/** Obtiene (o crea) el token activo para un chat_id que está en medio del flujo /vincular. */
async function getActiveFlowToken(chatId: number) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("telegram_link_tokens")
    .select(
      "token, patient_id, doctor_id, link_role, telegram_chat_id, step, dni, otp_code, otp_sent_at, expires_at, used_at, created_at"
    )
    .eq("telegram_chat_id", chatId)
    .in("step", ["awaiting_dni", "awaiting_otp"])
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function startTelegramLinkFlow(chatId: number): Promise<void> {
  const supabase = createAdminClient();
  // Invalidar cualquier flujo previo
  await supabase
    .from("telegram_link_tokens")
    .update({ used_at: new Date().toISOString(), step: "consumed" })
    .eq("telegram_chat_id", chatId)
    .in("step", ["awaiting_dni", "awaiting_otp"]);

  await supabase.from("telegram_link_tokens").insert({
    token: generateToken(),
    telegram_chat_id: chatId,
    step: "awaiting_dni",
    expires_at: expiresAt(TOKEN_TTL_MIN),
  });
}

export async function getFlowStep(chatId: number): Promise<"awaiting_dni" | "awaiting_otp" | null> {
  const row = await getActiveFlowToken(chatId);
  return (row?.step as "awaiting_dni" | "awaiting_otp") ?? null;
}

export async function submitDni(
  chatId: number,
  dni: string
): Promise<
  | { ok: true; email: string; otp: string }
  | { ok: false; reason: string }
> {
  const supabase = createAdminClient();
  const row = await getActiveFlowToken(chatId);
  if (!row || row.step !== "awaiting_dni")
    return { ok: false, reason: "No hay un flujo de vinculación activo. Escribe /vincular." };

  if (!/^\d{8}$/.test(dni)) return { ok: false, reason: "El DNI debe tener 8 dígitos." };

  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name, email")
    .eq("dni", dni)
    .maybeSingle();
  if (!patient) return { ok: false, reason: "No encontramos un paciente con ese DNI." };
  if (!patient.email)
    return { ok: false, reason: "Este paciente no tiene email registrado. Llama a recepción para actualizarlo." };

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  await supabase
    .from("telegram_link_tokens")
    .update({
      step: "awaiting_otp",
      dni,
      patient_id: patient.id,
      otp_code: otp,
      otp_sent_at: new Date().toISOString(),
      expires_at: expiresAt(OTP_TTL_MIN),
    })
    .eq("token", row.token);

  return { ok: true, email: patient.email, otp };
}

export async function verifyOtpAndLink(
  chatId: number,
  code: string,
  telegramUsername?: string,
  telegramFirstName?: string
): Promise<
  | { ok: true; patientFirstName: string }
  | { ok: false; reason: string }
> {
  const supabase = createAdminClient();
  const row = await getActiveFlowToken(chatId);
  if (!row || row.step !== "awaiting_otp" || !row.patient_id)
    return { ok: false, reason: "No hay un flujo activo. Escribe /vincular." };
  if (row.otp_code !== code.trim()) return { ok: false, reason: "Código incorrecto." };

  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name")
    .eq("id", row.patient_id)
    .maybeSingle();
  if (!patient) return { ok: false, reason: "Paciente no encontrado." };

  const { error } = await supabase
    .from("telegram_users")
    .upsert(
      {
        telegram_chat_id: chatId,
        telegram_username: telegramUsername ?? null,
        telegram_first_name: telegramFirstName ?? null,
        linked_entity_type: "patient",
        patient_id: patient.id,
        doctor_id: null,
        status: "active",
        linked_at: new Date().toISOString(),
      },
      { onConflict: "telegram_chat_id" }
    );
  if (error) return { ok: false, reason: error.message };

  await supabase
    .from("telegram_link_tokens")
    .update({ used_at: new Date().toISOString(), step: "consumed" })
    .eq("token", row.token);

  return { ok: true, patientFirstName: patient.first_name };
}

export async function unlinkByChatId(chatId: number): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("telegram_users")
    .update({ status: "unlinked" })
    .eq("telegram_chat_id", chatId);
  return !error;
}

/**
 * Marca como consumidos cualquier token de flujo /vincular activo para
 * un chat_id. Útil cuando ya está vinculado por otro mecanismo y el
 * step viejo quedó huérfano provocando confusión en el handler de
 * mensajes libres.
 */
export async function clearActiveFlowTokens(chatId: number): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("telegram_link_tokens")
    .update({ used_at: new Date().toISOString(), step: "consumed" })
    .eq("telegram_chat_id", chatId)
    .in("step", ["awaiting_dni", "awaiting_otp"]);
}
