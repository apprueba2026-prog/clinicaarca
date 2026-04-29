/**
 * POST /api/telegram/link-doctor
 *
 * Genera un token deep-link para vincular el Telegram de un doctor.
 * Solo personal de la clínica puede generar el link. El doctor abre
 * la URL devuelta en su Telegram, presiona "Iniciar" y queda vinculado.
 *
 * Body: { doctorId: string }
 * Returns: { url, expiresInSeconds }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWebLinkTokenForDoctor } from "@/lib/telegram/link-tokens";

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
      .select("id, profile_id")
      .eq("id", doctorId)
      .maybeSingle();
    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor no encontrado" },
        { status: 404 }
      );
    }

    // Solo admin o el propio doctor (dentist) pueden generar el enlace.
    // Recepcionistas no pueden manipular vinculaciones de Telegram.
    const isAdmin = profile.role === "admin";
    const isOwnDoctor =
      profile.role === "dentist" && doctor.profile_id === user.id;
    if (!isAdmin && !isOwnDoctor) {
      return NextResponse.json(
        {
          error:
            "Solo un admin o el doctor titular puede vincular su Telegram.",
        },
        { status: 403 }
      );
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      console.error(
        "[telegram/link-doctor] Falta env var TELEGRAM_BOT_USERNAME en producción."
      );
      return NextResponse.json(
        {
          error:
            "Servicio Telegram no configurado. Pide al administrador del sistema que defina la variable TELEGRAM_BOT_USERNAME en Vercel.",
        },
        { status: 503 }
      );
    }

    const token = await createWebLinkTokenForDoctor(doctorId);
    return NextResponse.json({
      url: `https://t.me/${botUsername}?start=${token}`,
      expiresInSeconds: 15 * 60,
    });
  } catch (err) {
    console.error("[telegram/link-doctor]", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
