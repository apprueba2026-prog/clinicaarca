/**
 * GET /api/cron/telegram-doctor-reports
 *
 * Cron: 12:00 UTC (07:00 PET).
 * Envía a cada doctor vinculado a Telegram su agenda del día.
 *
 * Seguridad: header `Authorization: Bearer ${CRON_SECRET}`.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage, sleep } from "@/lib/telegram/client";
import {
  buildDoctorDailyReport,
  type DoctorDailyReportAppointment,
} from "@/lib/telegram/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayLimaISO();

  // Doctores con telegram activo
  const { data: tgDoctors, error } = await supabase
    .from("telegram_users")
    .select("id, telegram_chat_id, doctor_id")
    .eq("linked_entity_type", "doctor")
    .eq("status", "active");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  let failed = 0;

  for (const tg of tgDoctors ?? []) {
    if (!tg.doctor_id) continue;

    // Perfil del doctor
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", tg.doctor_id)
      .maybeSingle();

    // Citas del día
    const { data: appts } = await supabase
      .from("appointments")
      .select(
        `
        start_time,
        end_time,
        status,
        room,
        patient:patients(first_name, last_name),
        procedure:procedures(name)
        `
      )
      .eq("doctor_id", tg.doctor_id)
      .eq("scheduled_date", today)
      .in("status", ["confirmed", "pending"])
      .order("start_time", { ascending: true });

    const mapped: DoctorDailyReportAppointment[] = (appts ?? []).map((a) => {
      const patient = Array.isArray(a.patient) ? a.patient[0] : a.patient;
      const proc = Array.isArray(a.procedure) ? a.procedure[0] : a.procedure;
      return {
        startTime: a.start_time,
        endTime: a.end_time,
        patientFullName: patient
          ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
          : "—",
        procedure: proc?.name ?? null,
        status: a.status,
        room: a.room,
      };
    });

    const text = buildDoctorDailyReport(profile?.first_name ?? "Doctor", today, mapped);

    const result = await sendTelegramMessage(tg.telegram_chat_id, text, {
      telegramUserId: tg.id,
      notificationType: "doctor_daily_report",
    });

    if (result.ok) sent++;
    else failed++;
    await sleep(60);
  }

  return NextResponse.json({
    ok: true,
    summary: { sent, failed, total: tgDoctors?.length ?? 0 },
  });
}

function todayLimaISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
