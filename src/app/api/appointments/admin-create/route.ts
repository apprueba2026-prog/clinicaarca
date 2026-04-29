import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appointmentSchema } from "@/lib/validators/appointment.schema";
import { sendConfirmationEmail } from "@/lib/email/send-appointment-emails";
import { notifyDoctorNewAppointment } from "@/lib/telegram/notify-doctor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, is_active, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    if (
      !profile ||
      !profile.is_active ||
      !["admin", "dentist", "receptionist"].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: "No autorizado: solo personal de la clínica" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const normalizeEmpty = (v: unknown) =>
      typeof v === "string" && v.trim() === "" ? null : v;
    const normalizedBody = body && typeof body === "object" ? {
      ...body,
      procedure_id: normalizeEmpty((body as Record<string, unknown>).procedure_id),
      custom_procedure: normalizeEmpty(
        (body as Record<string, unknown>).custom_procedure
      ),
      procedure_description: normalizeEmpty(
        (body as Record<string, unknown>).procedure_description
      ),
    } : body;
    const parsed = appointmentSchema.safeParse(normalizedBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      patient_id,
      doctor_id,
      procedure_id: rawProcedureId,
      custom_procedure: rawCustomProcedure,
      procedure_description: rawDescription,
      scheduled_date,
      start_time,
      end_time,
      priority,
      notes,
      room,
    } = parsed.data;
    const procedure_id = rawProcedureId && rawProcedureId !== "" ? rawProcedureId : null;
    const custom_procedure =
      rawCustomProcedure && rawCustomProcedure.trim() !== ""
        ? rawCustomProcedure.trim()
        : null;
    const procedure_description =
      rawDescription && rawDescription.trim() !== ""
        ? rawDescription.trim()
        : null;

    const startNormalized =
      start_time.length === 5 ? `${start_time}:00` : start_time;
    const endNormalized =
      end_time.length === 5 ? `${end_time}:00` : end_time;

    if (startNormalized >= endNormalized) {
      return NextResponse.json(
        { error: "La hora de fin debe ser posterior a la hora de inicio" },
        { status: 400 }
      );
    }

    const dateObj = new Date(scheduled_date + "T12:00:00");
    if (dateObj.getDay() === 0) {
      return NextResponse.json(
        { error: "No se atiende los domingos" },
        { status: 400 }
      );
    }

    const { data: isAvailable, error: slotError } = await supabase.rpc(
      "validate_appointment_slot",
      {
        p_doctor_id: doctor_id,
        p_date: scheduled_date,
        p_start: startNormalized,
        p_end: endNormalized,
        p_for_admin: true,
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
            "El horario seleccionado no está disponible (cita existente o bloqueo).",
        },
        { status: 409 }
      );
    }

    const composedNotes = [
      custom_procedure ? `[Procedimiento personalizado] ${custom_procedure}` : null,
      procedure_description?.trim() ? procedure_description.trim() : null,
      notes?.trim() ? notes.trim() : null,
    ]
      .filter(Boolean)
      .join("\n\n") || null;

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        patient_id,
        doctor_id,
        procedure_id: procedure_id ?? null,
        scheduled_date,
        start_time: startNormalized,
        end_time: endNormalized,
        status: "confirmed",
        priority,
        notes: composedNotes,
        room: room ?? null,
        created_by: profile.id,
      })
      .select(
        "id, patient_id, doctor_id, procedure_id, scheduled_date, start_time, end_time, status, priority, notes, room, created_by, created_at, updated_at"
      )
      .single();

    if (insertError || !appointment) {
      console.error("[admin-create appointment] insert", insertError);
      return NextResponse.json(
        { error: "No se pudo crear la cita" },
        { status: 500 }
      );
    }

    // Awaitar notificaciones para que NO se corten en serverless.
    // Cada una falla silenciosamente sin romper la respuesta al cliente.
    const notifications = await Promise.allSettled([
      sendConfirmationEmail({
        supabase,
        patientId: patient_id,
        doctorId: doctor_id,
        scheduledDate: scheduled_date,
        startTime: startNormalized,
        endTime: endNormalized,
        procedureId: procedure_id ?? null,
        procedureName: custom_procedure ?? null,
        procedureDescription: procedure_description ?? null,
      }),
      notifyDoctorNewAppointment({
        appointmentId: appointment.id,
        doctorId: doctor_id,
        patientId: patient_id,
        scheduledDate: scheduled_date,
        startTime: startNormalized,
        endTime: endNormalized,
        procedureName: custom_procedure ?? null,
        procedureDescription: procedure_description ?? null,
        scheduledBy:
          `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
          null,
      }),
    ]);

    notifications.forEach((n, i) => {
      if (n.status === "rejected") {
        console.error(
          `[admin-create] notificación ${i === 0 ? "email" : "telegram"} falló:`,
          n.reason
        );
      }
    });

    return NextResponse.json(
      { message: "Cita agendada exitosamente", appointment },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admin-create appointment]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
