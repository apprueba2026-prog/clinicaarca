/**
 * POST /api/telegram/unlink-doctor
 *
 * Marca como 'unlinked' la vinculación Telegram de un doctor.
 * No envía mensaje al chat (silencioso). El doctor puede volver a
 * vincular en cualquier momento generando un nuevo enlace.
 *
 * Body: { doctorId: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as { doctorId?: string };
    const doctorId = body.doctorId;
    if (!doctorId || !/^[0-9a-f-]{36}$/i.test(doctorId)) {
      return NextResponse.json({ error: "doctorId inválido" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: doctor } = await admin
      .from("doctors")
      .select("profile_id")
      .eq("id", doctorId)
      .maybeSingle();
    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor no encontrado" },
        { status: 404 }
      );
    }

    const isAdmin = profile.role === "admin";
    const isOwnDoctor =
      profile.role === "dentist" && doctor.profile_id === user.id;
    if (!isAdmin && !isOwnDoctor) {
      return NextResponse.json(
        {
          error:
            "Solo un admin o el doctor titular puede desvincular su Telegram.",
        },
        { status: 403 }
      );
    }

    const { error } = await admin
      .from("telegram_users")
      .update({ status: "unlinked" })
      .eq("doctor_id", doctorId)
      .eq("linked_entity_type", "doctor");

    if (error) {
      console.error("[telegram/unlink-doctor]", error);
      return NextResponse.json(
        { error: "No se pudo desvincular Telegram" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram/unlink-doctor]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
