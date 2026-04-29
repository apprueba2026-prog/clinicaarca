import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendRescheduledEmail } from "@/lib/email/send-appointment-emails";
import { notifyDoctorRescheduled } from "@/lib/telegram/notify-doctor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rescheduleSchema = z.object({
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
});

function normalizeTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = rescheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const newStart = normalizeTime(parsed.data.start_time);
    const newEnd = normalizeTime(parsed.data.end_time);
    const newDate = parsed.data.scheduled_date;

    if (newStart >= newEnd) {
      return NextResponse.json(
        { error: "La hora de fin debe ser posterior a la de inicio" },
        { status: 400 }
      );
    }

    const dateObj = new Date(newDate + "T12:00:00");
    if (dateObj.getDay() === 0) {
      return NextResponse.json(
        { error: "No se atiende los domingos" },
        { status: 400 }
      );
    }

    // Cargar cita actual
    const { data: current } = await supabase
      .from("appointments")
      .select(
        "id, status, patient_id, doctor_id, scheduled_date, start_time, end_time"
      )
      .eq("id", id)
      .maybeSingle();

    if (!current) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }
    if (!["pending", "confirmed"].includes(current.status as string)) {
      return NextResponse.json(
        {
          error: `No se puede reprogramar una cita en estado ${current.status}`,
        },
        { status: 400 }
      );
    }

    // Validar disponibilidad del nuevo slot (modo admin: ignora fixed_patients,
    // respeta unavailable y otras citas).
    // El validate compara contra TODAS las citas activas. Como vamos a mover
    // ESTA cita, primero la cancelamos lógicamente para que no se solape consigo misma.
    // Truco simple: si el nuevo slot coincide con el actual, retornamos OK.
    const sameSlot =
      current.scheduled_date === newDate &&
      current.start_time === newStart &&
      current.end_time === newEnd;

    if (!sameSlot) {
      const { data: isAvailable, error: slotError } = await supabase.rpc(
        "validate_appointment_slot",
        {
          p_doctor_id: current.doctor_id,
          p_date: newDate,
          p_start: newStart,
          p_end: newEnd,
          p_for_admin: true,
        }
      );

      if (slotError) {
        console.error("[reschedule] slot validation error:", slotError);
        return NextResponse.json(
          { error: "Error al verificar disponibilidad" },
          { status: 500 }
        );
      }

      if (!isAvailable) {
        // Excepción: el slot puede estar "ocupado" por la propia cita.
        // Verificamos si la única superposición somos nosotros.
        const { data: overlapping } = await supabase
          .from("appointments")
          .select("id")
          .eq("doctor_id", current.doctor_id)
          .eq("scheduled_date", newDate)
          .not("status", "in", "(cancelled,no_show)")
          .lt("start_time", newEnd)
          .gt("end_time", newStart);

        const onlySelf =
          overlapping && overlapping.length === 1 && overlapping[0].id === id;

        if (!onlySelf) {
          return NextResponse.json(
            { error: "El nuevo horario no está disponible" },
            { status: 409 }
          );
        }
      }
    }

    const oldDate = current.scheduled_date as string;
    const oldStart = current.start_time as string;
    const oldEnd = current.end_time as string;

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        scheduled_date: newDate,
        start_time: newStart,
        end_time: newEnd,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[reschedule] update error:", updateError);
      return NextResponse.json(
        { error: "No se pudo reprogramar la cita" },
        { status: 500 }
      );
    }

    const changedBy =
      `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || null;

    await Promise.allSettled([
      sendRescheduledEmail({
        supabase,
        patientId: current.patient_id as string,
        doctorId: current.doctor_id as string,
        oldDate,
        oldStart,
        oldEnd,
        newDate,
        newStart,
        newEnd,
      }),
      notifyDoctorRescheduled({
        appointmentId: id,
        doctorId: current.doctor_id as string,
        patientId: current.patient_id as string,
        oldDate,
        oldStart,
        oldEnd,
        newDate,
        newStart,
        newEnd,
        changedBy,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reschedule]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
