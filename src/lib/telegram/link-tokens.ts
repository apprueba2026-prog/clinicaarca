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
    step: "pending",
    expires_at: expiresAt(TOKEN_TTL_MIN),
  });
  if (error) throw new Error(`No se pudo crear token: ${error.message}`);
  return token;
}

export async function consumeWebLinkToken(
  token: string,
  chatId: number,
  telegramUsername?: string,
  telegramFirstName?: string
): Promise<{ ok: true; patientId: string; patientFirstName: string } | { ok: false; reason: string }> {
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("telegram_link_tokens")
    .select("token, patient_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();
  if (!row || !row.patient_id) return { ok: false, reason: "Token inválido" };
  if (row.used_at) return { ok: false, reason: "Token ya utilizado" };
  if (new Date(row.expires_at).getTime() < Date.now())
    return { ok: false, reason: "Token expirado" };

  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name")
    .eq("id", row.patient_id)
    .maybeSingle();
  if (!patient) return { ok: false, reason: "Paciente no encontrado" };

  // Upsert telegram_users (reactivar si existía con status unlinked)
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

  return { ok: true, patientId: patient.id, patientFirstName: patient.first_name };
}

// ------------------------------------------------------------
// Flujo 2 — /vincular desde Telegram
// ------------------------------------------------------------

/** Obtiene (o crea) el token activo para un chat_id que está en medio del flujo /vincular. */
async function getActiveFlowToken(chatId: number) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("telegram_link_tokens")
    .select("*")
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
