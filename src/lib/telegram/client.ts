/**
 * Cliente singleton de grammy para Noé (Telegram bot de Clínica Arca).
 *
 * Se inicializa lazy — el Bot solo se construye cuando se usa por
 * primera vez. Esto evita crashear el build si las env vars no están
 * configuradas en entornos de desarrollo.
 *
 * Uso:
 *   const bot = getBot();
 *   await sendTelegramMessage(chatId, text);
 */
import { Bot } from "grammy";
import { createAdminClient } from "@/lib/supabase/admin";

let _bot: Bot | null = null;

export function getBot(): Bot {
  if (_bot) return _bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN no está configurado");
  }
  _bot = new Bot(token);
  return _bot;
}

export type TelegramNotificationType =
  | "reminder_24h"
  | "doctor_daily_report"
  | "welcome"
  | "link_confirmation";

interface SendOptions {
  telegramUserId?: string | null;
  appointmentId?: string | null;
  notificationType?: TelegramNotificationType;
  parseMode?: "MarkdownV2" | "HTML";
}

/**
 * Envía un mensaje por Telegram y loguea el resultado en
 * telegram_notifications. No lanza — devuelve `{ok, error}`.
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  opts: SendOptions = {}
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const bot = getBot();
  const parseMode = opts.parseMode ?? "MarkdownV2";
  try {
    const msg = await bot.api.sendMessage(chatId, text, {
      parse_mode: parseMode,
      link_preview_options: { is_disabled: true },
    });
    if (opts.telegramUserId && opts.notificationType) {
      await logNotification({
        telegramUserId: opts.telegramUserId,
        appointmentId: opts.appointmentId ?? null,
        notificationType: opts.notificationType,
        status: "sent",
        telegramMessageId: msg.message_id,
      });
    }
    return { ok: true, messageId: msg.message_id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    if (opts.telegramUserId && opts.notificationType) {
      await logNotification({
        telegramUserId: opts.telegramUserId,
        appointmentId: opts.appointmentId ?? null,
        notificationType: opts.notificationType,
        status: "failed",
        errorMessage: error,
      });
    }
    return { ok: false, error };
  }
}

async function logNotification(params: {
  telegramUserId: string;
  appointmentId: string | null;
  notificationType: TelegramNotificationType;
  status: "sent" | "failed" | "skipped";
  telegramMessageId?: number;
  errorMessage?: string;
}): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("telegram_notifications").insert({
    telegram_user_id: params.telegramUserId,
    appointment_id: params.appointmentId,
    notification_type: params.notificationType,
    status: params.status,
    telegram_message_id: params.telegramMessageId ?? null,
    error_message: params.errorMessage ?? null,
  });
}

/** Pausa entre envíos para respetar el rate limit global de Telegram (~30 msg/s). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
