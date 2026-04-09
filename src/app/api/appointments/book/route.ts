import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bookingSchema } from "@/lib/validators/booking.schema";
import {
  MAX_FUTURE_APPOINTMENTS,
  MAX_ADVANCE_DAYS,
} from "@/lib/utils/constants";
import { sendConfirmationEmail } from "@/lib/email/send-appointment-emails";

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
        { error: "Debes iniciar sesión para agendar una cita" },
        { status: 401 }
      );
    }

    // 2. Verificar que es paciente
    const role = user.user_metadata?.role;
    if (role !== "patient") {
      return NextResponse.json(
        { error: "Solo los pacientes pueden agendar citas desde aquí" },
        { status: 403 }
      );
    }

    // 3. Obtener patient_id vinculado
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (patientError || !patientData) {
      return NextResponse.json(
        { error: "No se encontró tu perfil de paciente. Contacta a la clínica." },
        { status: 404 }
      );
    }

    const patientId = patientData.id;

    // 4. Validar body
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { doctor_id, procedure_id, scheduled_date, start_time, end_time, notes } =
      parsed.data;

    // Normalizar tiempos a HH:MM:SS
    const startNormalized = start_time.length === 5 ? `${start_time}:00` : start_time;
    const endNormalized = end_time.length === 5 ? `${end_time}:00` : end_time;

    // 5. Validar que no sea domingo
    const dateObj = new Date(scheduled_date + "T12:00:00");
    if (dateObj.getDay() === 0) {
      return NextResponse.json(
        { error: "No se atiende los domingos" },
        { status: 400 }
      );
    }

    // 6. Validar que la fecha esté dentro de 60 días
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);

    if (dateObj < today) {
      return NextResponse.json(
        { error: "No puedes agendar en una fecha pasada" },
        { status: 400 }
      );
    }

    if (dateObj > maxDate) {
      return NextResponse.json(
        { error: `Solo puedes agendar hasta ${MAX_ADVANCE_DAYS} días de anticipación` },
        { status: 400 }
      );
    }

    // 7. Verificar límite de citas futuras
    const { data: countData, error: countError } = await supabase.rpc(
      "count_patient_future_appointments",
      { p_patient_id: patientId }
    );

    if (countError) {
      return NextResponse.json(
        { error: "Error al verificar citas existentes" },
        { status: 500 }
      );
    }

    if ((countData as number) >= MAX_FUTURE_APPOINTMENTS) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${MAX_FUTURE_APPOINTMENTS} citas futuras. Cancela alguna para agendar otra.`,
        },
        { status: 400 }
      );
    }

    // 8. Validar que el slot siga disponible (anti-race-condition)
    const { data: isAvailable, error: slotError } = await supabase.rpc(
      "validate_appointment_slot",
      {
        p_doctor_id: doctor_id,
        p_date: scheduled_date,
        p_start: startNormalized,
        p_end: endNormalized,
      }
    );

    if (slotError) {
      return NextResponse.json(
        { error: "Error al verificar disponibilidad" },
        { status: 500 }
      );
    }

    if (!isAvailable) {
      return NextResponse.json(
        { error: "El horario seleccionado ya no está disponible. Elige otro." },
        { status: 409 }
      );
    }

    // 9. Crear la cita con status 'confirmed'
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        doctor_id,
        procedure_id: procedure_id ?? null,
        scheduled_date,
        start_time: startNormalized,
        end_time: endNormalized,
        status: "confirmed",
        priority: "normal",
        notes: notes ?? null,
        room: null,
        created_by: null,
      })
      .select("id, scheduled_date, start_time, end_time, status")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Error al crear la cita. Intenta de nuevo." },
        { status: 500 }
      );
    }

    // 10. Enviar email de confirmación (fire-and-forget)
    sendConfirmationEmail({
      supabase,
      patientId,
      doctorId: doctor_id,
      scheduledDate: scheduled_date,
      startTime: startNormalized,
      endTime: endNormalized,
    });

    return NextResponse.json(
      {
        message: "Cita agendada exitosamente",
        appointment,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
