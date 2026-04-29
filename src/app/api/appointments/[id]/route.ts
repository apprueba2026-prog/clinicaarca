import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendCancellationEmail } from "@/lib/email/send-appointment-emails";
import { notifyDoctorCancelled } from "@/lib/telegram/notify-doctor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APPOINTMENT_SELECT =
  "id, patient_id, doctor_id, procedure_id, scheduled_date, start_time, end_time, status, priority, notes, room, created_by, created_at, updated_at";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "No autenticado", status: 401 as const };
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
    return { error: "No autorizado", status: 403 as const };
  }

  return { supabase, profile };
}

// ----- GET: detalle completo con paciente y doctor -----
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireStaff();
    if ("error" in guard) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status }
      );
    }
    const { supabase } = guard;
    const { id } = await params;

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `id, scheduled_date, start_time, end_time, status, priority, notes, room, procedure_id, created_at, updated_at,
         patient:patients(id, first_name, last_name, dni, phone, email),
         doctor:doctors(id, specialties, profile:profiles(first_name, last_name)),
         procedure:procedures(id, name, category)`
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[appointments GET]", error);
      return NextResponse.json(
        { error: "Error consultando la cita" },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ appointment: data });
  } catch (err) {
    console.error("[appointments GET]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ----- PATCH: editar campos in-place (no fecha/hora ni doctor) -----
const patchSchema = z.object({
  status: z
    .enum([
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ])
    .optional(),
  priority: z.enum(["normal", "high", "urgent"]).optional(),
  notes: z.string().nullable().optional(),
  room: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireStaff();
    if ("error" in guard) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status }
      );
    }
    const { supabase } = guard;
    const { id } = await params;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Sin campos para actualizar" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .select(APPOINTMENT_SELECT)
      .maybeSingle();

    if (error || !data) {
      console.error("[appointments PATCH]", error);
      return NextResponse.json(
        { error: "No se pudo actualizar la cita" },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment: data });
  } catch (err) {
    console.error("[appointments PATCH]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ----- DELETE: cancelación admin (soft cancel) + notifica -----
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireStaff();
    if ("error" in guard) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status }
      );
    }
    const { supabase, profile } = guard;
    const { id } = await params;

    // Cargar cita actual antes del cambio (para notificar)
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

    if (current.status === "cancelled") {
      return NextResponse.json(
        { error: "La cita ya está cancelada" },
        { status: 400 }
      );
    }
    if (current.status === "completed") {
      return NextResponse.json(
        { error: "No se puede cancelar una cita completada" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (updateError) {
      console.error("[appointments DELETE]", updateError);
      return NextResponse.json(
        { error: "No se pudo cancelar la cita" },
        { status: 500 }
      );
    }

    const changedBy =
      `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || null;

    // Notificaciones (no bloquean la respuesta si fallan)
    await Promise.allSettled([
      sendCancellationEmail({
        supabase,
        patientId: current.patient_id as string,
        doctorId: current.doctor_id as string,
        scheduledDate: current.scheduled_date as string,
        startTime: current.start_time as string,
        endTime: current.end_time as string,
      }),
      notifyDoctorCancelled({
        appointmentId: id,
        doctorId: current.doctor_id as string,
        patientId: current.patient_id as string,
        scheduledDate: current.scheduled_date as string,
        startTime: current.start_time as string,
        endTime: current.end_time as string,
        changedBy,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[appointments DELETE]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
