import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelAppointmentSchema } from "@/lib/validators/patient-profile.schema";
import { MIN_CANCEL_HOURS } from "@/lib/utils/constants";
import { sendCancellationEmail } from "@/lib/email/send-appointment-emails";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    // 2. Verificar que es paciente
    if (user.user_metadata?.role !== "patient") {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    // 3. Obtener patient_id
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (patientError || !patientData) {
      return NextResponse.json(
        { error: "Perfil de paciente no encontrado" },
        { status: 404 }
      );
    }

    // 4. Validar body
    const body = await request.json();
    const parsed = cancelAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const { appointment_id } = parsed.data;

    // 5. Obtener la cita y verificar que pertenece al paciente
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, patient_id, doctor_id, scheduled_date, start_time, end_time, status")
      .eq("id", appointment_id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    if (appointment.patient_id !== patientData.id) {
      return NextResponse.json(
        { error: "No puedes cancelar una cita que no es tuya" },
        { status: 403 }
      );
    }

    // 6. Verificar que la cita es cancelable (pending o confirmed)
    if (!["pending", "confirmed"].includes(appointment.status)) {
      return NextResponse.json(
        { error: "Esta cita no puede ser cancelada" },
        { status: 400 }
      );
    }

    // 7. Verificar política de cancelación (24h antes)
    const appointmentDateTime = new Date(
      `${appointment.scheduled_date}T${appointment.start_time}`
    );
    const now = new Date();
    const hoursUntil =
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < MIN_CANCEL_HOURS) {
      return NextResponse.json(
        {
          error: `Solo puedes cancelar con al menos ${MIN_CANCEL_HOURS} horas de anticipación`,
        },
        { status: 400 }
      );
    }

    // 8. Cancelar la cita
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Error al cancelar la cita" },
        { status: 500 }
      );
    }

    // 9. Enviar email de cancelación (fire-and-forget)
    sendCancellationEmail({
      supabase,
      patientId: patientData.id,
      doctorId: appointment.doctor_id,
      scheduledDate: appointment.scheduled_date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
    });

    return NextResponse.json({
      message: "Cita cancelada exitosamente",
    });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
