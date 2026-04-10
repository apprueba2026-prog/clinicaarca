import { sendEmail } from "./send-email";
import { appointmentConfirmationTemplate } from "./templates/appointment-confirmation";
import { appointmentConfirmationGuestTemplate } from "./templates/appointment-confirmation-guest";
import { appointmentCancelledTemplate } from "./templates/appointment-cancelled";
import type { SupabaseClient } from "@supabase/supabase-js";

const specialtyLabels: Record<string, string> = {
  general: "Odontología General",
  implantes: "Implantes Dentales",
  odontopediatria: "Odontopediatría",
  ortodoncia: "Ortodoncia",
  sedacion: "Sedación Dental",
  cirugia: "Cirugía Oral",
  estetica: "Estética Dental",
  endodoncia: "Endodoncia",
  periodoncia: "Periodoncia",
};

function formatDateES(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

interface AppointmentEmailContext {
  supabase: SupabaseClient;
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
}

/** Obtener datos necesarios para el email */
async function getEmailContext(ctx: AppointmentEmailContext) {
  const { supabase, patientId, doctorId } = ctx;

  const [patientResult, doctorResult] = await Promise.all([
    supabase
      .from("patients")
      .select("first_name, last_name, email")
      .eq("id", patientId)
      .single(),
    supabase
      .from("doctors")
      .select(
        "specialties, consultation_duration_minutes, profile:profiles(first_name, last_name)"
      )
      .eq("id", doctorId)
      .single(),
  ]);

  if (patientResult.error || !patientResult.data) return null;
  if (doctorResult.error || !doctorResult.data) return null;

  const patient = patientResult.data;
  const doctor = doctorResult.data as unknown as {
    specialties: string[];
    consultation_duration_minutes: number;
    profile: { first_name: string; last_name: string };
  };

  if (!patient.email) return null;

  const primarySpecialty = doctor.specialties[0] ?? "general";

  return {
    patientEmail: patient.email,
    patientName: `${patient.first_name} ${patient.last_name}`,
    doctorName: `Dr(a). ${doctor.profile.first_name} ${doctor.profile.last_name}`,
    specialty: specialtyLabels[primarySpecialty] ?? primarySpecialty,
    duration: doctor.consultation_duration_minutes,
  };
}

/** Enviar email de confirmación de cita */
export async function sendConfirmationEmail(ctx: AppointmentEmailContext) {
  try {
    const data = await getEmailContext(ctx);
    if (!data) return;

    const html = appointmentConfirmationTemplate({
      patientName: data.patientName,
      doctorName: data.doctorName,
      specialty: data.specialty,
      date: formatDateES(ctx.scheduledDate),
      time: `${formatTime(ctx.startTime)} - ${formatTime(ctx.endTime)}`,
      duration: data.duration,
    });

    await sendEmail({
      to: data.patientEmail,
      subject: `Cita confirmada — ${formatDateES(ctx.scheduledDate)}`,
      html,
    });
  } catch (err) {
    console.error("[EMAIL] Error enviando confirmación:", err);
  }
}

/** Enviar email de confirmación para paciente guest (sin cuenta) */
export async function sendGuestConfirmationEmail(params: {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  specialty: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  siteUrl: string;
}) {
  try {
    const registerUrl = `${params.siteUrl}/registro?email=${encodeURIComponent(params.patientEmail)}&next=/mi-cuenta`;

    const html = appointmentConfirmationGuestTemplate({
      patientName: params.patientName,
      doctorName: params.doctorName,
      specialty: params.specialty,
      date: formatDateES(params.scheduledDate),
      time: `${formatTime(params.startTime)} - ${formatTime(params.endTime)}`,
      duration: params.duration,
      registerUrl,
    });

    await sendEmail({
      to: params.patientEmail,
      subject: `Cita confirmada — ${formatDateES(params.scheduledDate)}`,
      html,
    });
  } catch (err) {
    console.error("[EMAIL] Error enviando confirmación guest:", err);
  }
}

/** Enviar email de cancelación de cita */
export async function sendCancellationEmail(ctx: AppointmentEmailContext) {
  try {
    const data = await getEmailContext(ctx);
    if (!data) return;

    const html = appointmentCancelledTemplate({
      patientName: data.patientName,
      doctorName: data.doctorName,
      date: formatDateES(ctx.scheduledDate),
      time: `${formatTime(ctx.startTime)} - ${formatTime(ctx.endTime)}`,
    });

    await sendEmail({
      to: data.patientEmail,
      subject: `Cita cancelada — ${formatDateES(ctx.scheduledDate)}`,
      html,
    });
  } catch (err) {
    console.error("[EMAIL] Error enviando cancelación:", err);
  }
}
