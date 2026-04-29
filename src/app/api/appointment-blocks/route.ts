import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appointmentBlockSchema } from "@/lib/validators/appointment-block.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    .select("id, role, is_active")
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

export async function POST(request: Request) {
  try {
    const guard = await requireStaff();
    if ("error" in guard) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status }
      );
    }
    const { supabase, profile } = guard;

    const body = await request.json();
    const parsed = appointmentBlockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const startNormalized = data.start_time
      ? data.start_time.length === 5
        ? `${data.start_time}:00`
        : data.start_time
      : null;
    const endNormalized = data.end_time
      ? data.end_time.length === 5
        ? `${data.end_time}:00`
        : data.end_time
      : null;

    const { data: created, error: insertError } = await supabase
      .from("appointment_blocks")
      .insert({
        doctor_id: data.doctor_id,
        block_type: data.block_type,
        block_date: data.block_date,
        start_time: startNormalized,
        end_time: endNormalized,
        title: data.title ?? null,
        notes: data.notes ?? null,
        created_by: profile.id,
      })
      .select(
        "id, doctor_id, block_type, block_date, start_time, end_time, title, notes, created_by, created_at, updated_at"
      )
      .single();

    if (insertError || !created) {
      console.error("[appointment-blocks POST] insert", insertError);
      return NextResponse.json(
        { error: "No se pudo crear la pre-reserva" },
        { status: 500 }
      );
    }

    return NextResponse.json({ block: created }, { status: 201 });
  } catch (err) {
    console.error("[appointment-blocks POST]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const guard = await requireStaff();
    if ("error" in guard) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status }
      );
    }
    const { supabase } = guard;

    const url = new URL(request.url);
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    const doctorId = url.searchParams.get("doctor_id");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Faltan parámetros start_date y end_date" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("appointment_blocks")
      .select(
        "id, doctor_id, block_type, block_date, start_time, end_time, title, notes, created_by, created_at, updated_at"
      )
      .gte("block_date", startDate)
      .lte("block_date", endDate)
      .order("block_date", { ascending: true })
      .limit(500);

    if (doctorId) query = query.eq("doctor_id", doctorId);

    const { data, error } = await query;
    if (error) {
      console.error("[appointment-blocks GET]", error);
      return NextResponse.json(
        { error: "No se pudieron cargar las pre-reservas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ blocks: data ?? [] });
  } catch (err) {
    console.error("[appointment-blocks GET]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
