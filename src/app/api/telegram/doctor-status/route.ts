/**
 * GET /api/telegram/doctor-status?doctorId=<uuid>
 *
 * Devuelve el estado de vinculación Telegram para un doctor:
 *   { linked: false }
 * o
 *   { linked: true, telegram_username, telegram_first_name, linked_at }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
    if (
      !profile ||
      !profile.is_active ||
      !["admin", "dentist", "receptionist"].includes(profile.role)
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const url = new URL(req.url);
    const doctorId = url.searchParams.get("doctorId");
    if (!doctorId || !/^[0-9a-f-]{36}$/i.test(doctorId)) {
      return NextResponse.json({ error: "doctorId inválido" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: tg } = await admin
      .from("telegram_users")
      .select("telegram_username, telegram_first_name, linked_at, status")
      .eq("doctor_id", doctorId)
      .eq("linked_entity_type", "doctor")
      .eq("status", "active")
      .maybeSingle();

    if (!tg) return NextResponse.json({ linked: false });

    return NextResponse.json({
      linked: true,
      telegram_username: tg.telegram_username,
      telegram_first_name: tg.telegram_first_name,
      linked_at: tg.linked_at,
    });
  } catch (err) {
    console.error("[telegram/doctor-status]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
