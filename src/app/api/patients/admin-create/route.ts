import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patientSchema } from "@/lib/validators/patient.schema";

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
      .select("id, role, is_active")
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
    const parsed = patientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("document_type", data.document_type)
      .eq("dni", data.dni)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Ya existe un paciente con este documento. Búscalo en el selector.",
          existing_patient_id: existing.id,
        },
        { status: 409 }
      );
    }

    const { data: created, error: insertError } = await supabase
      .from("patients")
      .insert({
        document_type: data.document_type,
        dni: data.dni,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        birth_date: data.birth_date && data.birth_date !== "" ? data.birth_date : null,
        address: data.address && data.address !== "" ? data.address : null,
        insurance_partner_id: data.insurance_partner_id ?? null,
        insurance_policy_number:
          data.insurance_policy_number && data.insurance_policy_number !== ""
            ? data.insurance_policy_number
            : null,
        notes: data.notes && data.notes !== "" ? data.notes : null,
        status: "new",
      })
      .select(
        "id, dni, document_type, first_name, last_name, email, phone, birth_date, address, status, created_at"
      )
      .single();

    if (insertError || !created) {
      if (insertError?.code === "23505") {
        return NextResponse.json(
          { error: "Ya existe un paciente con este documento." },
          { status: 409 }
        );
      }
      console.error("[admin-create patient] insert", insertError);
      return NextResponse.json(
        { error: "No se pudo registrar el paciente" },
        { status: 500 }
      );
    }

    return NextResponse.json({ patient: created }, { status: 201 });
  } catch (err) {
    console.error("[admin-create patient]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
