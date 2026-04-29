import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "./client";
import { buildNewAppointmentForDoctor } from "./templates";

interface NotifyDoctorParams {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  procedureName?: string | null;
  procedureDescription?: string | null;
  scheduledBy?: string | null;
}

/**
 * Envía un Telegram al doctor cuando la admin agenda una cita.
 * Silencioso si el doctor no tiene Telegram vinculado o si falla el envío.
 */
export async function notifyDoctorNewAppointment(
  params: NotifyDoctorParams
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const supabase = createAdminClient();

    const { data: tgUser } = await supabase
      .from("telegram_users")
      .select("id, telegram_chat_id, doctor_id")
      .eq("doctor_id", params.doctorId)
      .eq("linked_entity_type", "doctor")
      .eq("status", "active")
      .maybeSingle();

    if (!tgUser) return { ok: false, reason: "doctor_not_linked" };

    const [{ data: doctor }, { data: patient }] = await Promise.all([
      supabase
        .from("doctors")
        .select("profile:profiles(first_name, last_name)")
        .eq("id", params.doctorId)
        .maybeSingle(),
      supabase
        .from("patients")
        .select("first_name, last_name")
        .eq("id", params.patientId)
        .maybeSingle(),
    ]);

    const doctorProfile = (doctor as unknown as {
      profile: { first_name: string; last_name: string } | null;
    } | null)?.profile;

    const patientFullName = patient
      ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
      : "—";

    const text = buildNewAppointmentForDoctor({
      doctorFirstName: doctorProfile?.first_name ?? "Doctor",
      patientFullName: patientFullName || "—",
      scheduledDate: params.scheduledDate,
      startTime: params.startTime,
      endTime: params.endTime,
      procedureName: params.procedureName ?? null,
      procedureDescription: params.procedureDescription ?? null,
      scheduledBy: params.scheduledBy ?? null,
    });

    const result = await sendTelegramMessage(tgUser.telegram_chat_id, text, {
      telegramUserId: tgUser.id,
      appointmentId: params.appointmentId,
      notificationType: "new_appointment_admin",
    });

    return { ok: result.ok, reason: result.error };
  } catch (err) {
    console.error("[TELEGRAM] notifyDoctorNewAppointment error:", err);
    return { ok: false, reason: "exception" };
  }
}
