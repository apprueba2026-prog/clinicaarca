import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validators/patient-profile.schema";

const PATIENT_COLUMNS =
  "id, auth_user_id, dni, first_name, last_name, email, phone, birth_date, address, status, created_at, updated_at";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    if (user.user_metadata?.role !== "patient") {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("patients")
      .select(PATIENT_COLUMNS)
      .eq("auth_user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ patient: data });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    if (user.user_metadata?.role !== "patient") {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("patients")
      .update(parsed.data)
      .eq("auth_user_id", user.id)
      .select(PATIENT_COLUMNS)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Error al actualizar perfil" },
        { status: 500 }
      );
    }

    return NextResponse.json({ patient: data });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
