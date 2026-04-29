import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "./client";
import {
  buildNewAppointmentForDoctor,
  buildRescheduledForDoctor,
  buildCancelledForDoctor,
} from "./templates";

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

interface ResolvedDoctorAndPatient {
  chatId: string;
  telegramUserId: string;
  doctorFirstName: string;
  patientFullName: string;
}

async function resolveDoctorAndPatient(
  doctorId: string,
  patientId: string
): Promise<ResolvedDoctorAndPatient | null> {
  const supabase = createAdminClient();

  const { data: tgUser } = await supabase
    .from("telegram_users")
    .select("id, telegram_chat_id, doctor_id")
    .eq("doctor_id", doctorId)
    .eq("linked_entity_type", "doctor")
    .eq("status", "active")
    .maybeSingle();

  if (!tgUser) return null;

  const [{ data: doctor }, { data: patient }] = await Promise.all([
    supabase
      .from("doctors")
      .select("profile:profiles(first_name, last_name)")
      .eq("id", doctorId)
      .maybeSingle(),
    supabase
      .from("patients")
      .select("first_name, last_name")
      .eq("id", patientId)
      .maybeSingle(),
  ]);

  const doctorProfile = (doctor as unknown as {
    profile: { first_name: string; last_name: string } | null;
  } | null)?.profile;

  const patientFullName = patient
    ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
    : "—";

  return {
    chatId: tgUser.telegram_chat_id as string,
    telegramUserId: tgUser.id as string,
    doctorFirstName: doctorProfile?.first_name ?? "Doctor",
    patientFullName: patientFullName || "—",
  };
}

/**
 * Envía un Telegram al doctor cuando la admin agenda una cita.
 * Silencioso si el doctor no tiene Telegram vinculado o si falla el envío.
 */
export async function notifyDoctorNewAppointment(
  params: NotifyDoctorParams
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const resolved = await resolveDoctorAndPatient(
      params.doctorId,
      params.patientId
    );
    if (!resolved) return { ok: false, reason: "doctor_not_linked" };

    const text = buildNewAppointmentForDoctor({
      doctorFirstName: resolved.doctorFirstName,
      patientFullName: resolved.patientFullName,
      scheduledDate: params.scheduledDate,
      startTime: params.startTime,
      endTime: params.endTime,
      procedureName: params.procedureName ?? null,
      procedureDescription: params.procedureDescription ?? null,
      scheduledBy: params.scheduledBy ?? null,
    });

    const result = await sendTelegramMessage(resolved.chatId, text, {
      telegramUserId: resolved.telegramUserId,
      appointmentId: params.appointmentId,
      notificationType: "new_appointment_admin",
    });

    return { ok: result.ok, reason: result.error };
  } catch (err) {
    console.error("[TELEGRAM] notifyDoctorNewAppointment error:", err);
    return { ok: false, reason: "exception" };
  }
}

interface NotifyDoctorRescheduledParams {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  oldDate: string;
  oldStart: string;
  oldEnd: string;
  newDate: string;
  newStart: string;
  newEnd: string;
  changedBy?: string | null;
}

export async function notifyDoctorRescheduled(
  params: NotifyDoctorRescheduledParams
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const resolved = await resolveDoctorAndPatient(
      params.doctorId,
      params.patientId
    );
    if (!resolved) return { ok: false, reason: "doctor_not_linked" };

    const text = buildRescheduledForDoctor({
      doctorFirstName: resolved.doctorFirstName,
      patientFullName: resolved.patientFullName,
      oldDate: params.oldDate,
      oldStart: params.oldStart,
      oldEnd: params.oldEnd,
      newDate: params.newDate,
      newStart: params.newStart,
      newEnd: params.newEnd,
      changedBy: params.changedBy ?? null,
    });

    const result = await sendTelegramMessage(resolved.chatId, text, {
      telegramUserId: resolved.telegramUserId,
      appointmentId: params.appointmentId,
      notificationType: "rescheduled_admin",
    });
    return { ok: result.ok, reason: result.error };
  } catch (err) {
    console.error("[TELEGRAM] notifyDoctorRescheduled error:", err);
    return { ok: false, reason: "exception" };
  }
}

interface NotifyDoctorCancelledParams {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  changedBy?: string | null;
}

export async function notifyDoctorCancelled(
  params: NotifyDoctorCancelledParams
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const resolved = await resolveDoctorAndPatient(
      params.doctorId,
      params.patientId
    );
    if (!resolved) return { ok: false, reason: "doctor_not_linked" };

    const text = buildCancelledForDoctor({
      doctorFirstName: resolved.doctorFirstName,
      patientFullName: resolved.patientFullName,
      scheduledDate: params.scheduledDate,
      startTime: params.startTime,
      endTime: params.endTime,
      changedBy: params.changedBy ?? null,
    });

    const result = await sendTelegramMessage(resolved.chatId, text, {
      telegramUserId: resolved.telegramUserId,
      appointmentId: params.appointmentId,
      notificationType: "cancelled_admin",
    });
    return { ok: result.ok, reason: result.error };
  } catch (err) {
    console.error("[TELEGRAM] notifyDoctorCancelled error:", err);
    return { ok: false, reason: "exception" };
  }
}
