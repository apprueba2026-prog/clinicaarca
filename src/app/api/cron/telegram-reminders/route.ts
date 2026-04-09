/**
 * GET /api/cron/telegram-reminders
 *
 * Cron: 01:00 UTC (20:00 PET del día anterior).
 * Envía recordatorios por Telegram a pacientes con cita mañana.
 *
 * Coordinación con el cron de email:
 *  - Este cron corre ANTES del de email.
 *  - Si enviamos Telegram exitosamente, escribimos una row en `email_log`
 *    con status='skipped' para esa cita → el cron de email la excluye
 *    (la vista tomorrow_appointments_to_remind descarta las que ya tienen
 *    un registro sent/skipped en email_log con template_type='reminder').
 *
 * Seguridad: header `Authorization: Bearer ${CRON_SECRET}`.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage, sleep } from "@/lib/telegram/client";
import { buildReminderMessage } from "@/lib/telegram/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Citas de mañana confirmadas con paciente que tenga telegram activo
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      scheduled_date,
      start_time,
      room,
      patient_id,
      doctor_id,
      procedure:procedures(name, category),
      patient:patients!inner(first_name, last_name)
      `
    )
    .eq("status", "confirmed")
    .eq("scheduled_date", tomorrowISO());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const details: Array<Record<string, unknown>> = [];

  for (const a of appointments ?? []) {
    // Buscar telegram_user activo para el paciente
    const { data: tgUser } = await supabase
      .from("telegram_users")
      .select("id, telegram_chat_id")
      .eq("patient_id", a.patient_id)
      .eq("status", "active")
      .maybeSingle();

    if (!tgUser) {
      skipped++;
      continue;
    }

    // Evitar doble envío por idempotencia
    const { data: already } = await supabase
      .from("telegram_notifications")
      .select("id")
      .eq("appointment_id", a.id)
      .eq("notification_type", "reminder_24h")
      .eq("status", "sent")
      .maybeSingle();
    if (already) {
      skipped++;
      continue;
    }

    // Obtener nombre del doctor (profile)
    const { data: doctorProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", a.doctor_id)
      .maybeSingle();

    const patient = Array.isArray(a.patient) ? a.patient[0] : a.patient;
    const procedure = Array.isArray(a.procedure) ? a.procedure[0] : a.procedure;

    const text = buildReminderMessage({
      patientFirstName: patient?.first_name ?? "",
      doctorFullName: doctorProfile
        ? `${doctorProfile.first_name ?? ""} ${doctorProfile.last_name ?? ""}`.trim()
        : "nuestro equipo",
      specialty: procedure?.name ?? null,
      scheduledDate: a.scheduled_date,
      startTime: a.start_time,
      room: a.room,
    });

    const result = await sendTelegramMessage(tgUser.telegram_chat_id, text, {
      telegramUserId: tgUser.id,
      appointmentId: a.id,
      notificationType: "reminder_24h",
    });

    if (result.ok) {
      sent++;
      // Marcar skip en email_log para que el cron de email no duplique
      await supabase.from("email_log").insert({
        recipient_email: "telegram",
        template_type: "reminder",
        status: "skipped",
        related_appointment_id: a.id,
        error_message: "Enviado por Telegram",
      });
    } else {
      failed++;
    }
    details.push({ appointmentId: a.id, result: result.ok ? "sent" : "failed" });
    await sleep(60); // respetar rate limit ~30 msg/s
  }

  return NextResponse.json({
    ok: true,
    summary: { sent, failed, skipped, total: appointments?.length ?? 0 },
    details,
  });
}

function tomorrowISO(): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + 1);
  // Lima = UTC-5, pero usamos Intl para ser consistentes
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
}
