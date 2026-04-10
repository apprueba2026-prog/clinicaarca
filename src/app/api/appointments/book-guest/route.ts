import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { guestBookingSchema } from "@/lib/validators/guest-booking.schema";
import { MAX_ADVANCE_DAYS } from "@/lib/utils/constants";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendGuestConfirmationEmail } from "@/lib/email/send-appointment-emails";

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

export async function POST(request: Request) {
  try {
    // 1. Rate limit por IP (3 bookings / hora)
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    const rateCheck = await checkRateLimit(`guest-booking:${ip}`, {
      max: 3,
      windowSeconds: 3600,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Demasiadas reservas. Intenta de nuevo más tarde." },
        { status: 429 }
      );
    }

    // 2. Validar body
    const body = await request.json();
    const parsed = guestBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      guest_name,
      guest_phone,
      guest_email,
      guest_dni,
      doctor_id,
      scheduled_date,
      start_time,
      end_time,
      notes,
    } = parsed.data;

    // Normalizar tiempos a HH:MM:SS
    const startNormalized =
      start_time.length === 5 ? `${start_time}:00` : start_time;
    const endNormalized = end_time.length === 5 ? `${end_time}:00` : end_time;

    // 3. Validar fecha
    const dateObj = new Date(scheduled_date + "T12:00:00");
    if (dateObj.getDay() === 0) {
      return NextResponse.json(
        { error: "No se atiende los domingos" },
        { status: 400 }
      );
    }

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
        {
          error: `Solo puedes agendar hasta ${MAX_ADVANCE_DAYS} días de anticipación`,
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 4. Validar que el slot siga disponible
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
        {
          error:
            "El horario seleccionado ya no está disponible. Elige otro.",
        },
        { status: 409 }
      );
    }

    // 5. Buscar o crear paciente
    // Separar nombre en first_name y last_name
    const nameParts = guest_name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    // Buscar por email (paciente existente sin cuenta)
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id, auth_user_id")
      .eq("email", guest_email)
      .maybeSingle();

    let patientId: string;

    if (existingPatient) {
      // Si ya tiene auth_user_id, es un usuario registrado → debería usar el flujo normal
      if (existingPatient.auth_user_id) {
        return NextResponse.json(
          {
            error:
              "Ya tienes una cuenta registrada. Inicia sesión para agendar tu cita.",
          },
          { status: 400 }
        );
      }
      // Actualizar datos del paciente guest existente
      patientId = existingPatient.id;
      await supabase
        .from("patients")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: guest_phone,
          dni: guest_dni,
        })
        .eq("id", patientId);
    } else {
      // Crear nuevo paciente guest
      const { data: newPatient, error: createError } = await supabase
        .from("patients")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: guest_email,
          phone: guest_phone,
          dni: guest_dni,
          status: "new",
        })
        .select("id")
        .single();

      if (createError || !newPatient) {
        // DNI duplicado es el error más probable
        if (createError?.code === "23505") {
          return NextResponse.json(
            {
              error:
                "El DNI ingresado ya está registrado. Si tienes cuenta, inicia sesión.",
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: "Error al registrar tus datos. Intenta de nuevo." },
          { status: 500 }
        );
      }
      patientId = newPatient.id;
    }

    // 6. Crear la cita
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        doctor_id,
        procedure_id: null,
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

    // 7. Obtener datos del doctor para el email
    const { data: doctorData } = await supabase
      .from("doctors")
      .select(
        "specialties, consultation_duration_minutes, profile:profiles(first_name, last_name)"
      )
      .eq("id", doctor_id)
      .single();

    const doctor = doctorData as unknown as {
      specialties: string[];
      consultation_duration_minutes: number;
      profile: { first_name: string; last_name: string };
    } | null;

    // 8. Enviar email de confirmación (fire-and-forget)
    if (doctor) {
      const primarySpecialty = doctor.specialties[0] ?? "general";
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://clinicaarca.com";

      sendGuestConfirmationEmail({
        patientName: guest_name,
        patientEmail: guest_email,
        doctorName: `Dr(a). ${doctor.profile.first_name} ${doctor.profile.last_name}`,
        specialty: specialtyLabels[primarySpecialty] ?? primarySpecialty,
        scheduledDate: scheduled_date,
        startTime: startNormalized,
        endTime: endNormalized,
        duration: doctor.consultation_duration_minutes,
        siteUrl,
      });
    }

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
