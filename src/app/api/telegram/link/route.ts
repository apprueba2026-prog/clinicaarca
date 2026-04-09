/**
 * POST /api/telegram/link
 *
 * Genera un token one-shot para el flujo deep-link web → Telegram.
 * Usado por el chat de Noé tras crear una cita: el frontend llama a este
 * endpoint con el patientId, recibe una URL t.me/<bot>?start=<token> y
 * renderiza un botón "Recibir recordatorios por Telegram".
 *
 * El token expira en 15 minutos y solo puede consumirse una vez.
 */
import { NextRequest, NextResponse } from "next/server";
import { createWebLinkToken } from "@/lib/telegram/link-tokens";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { patientId } = (await req.json()) as { patientId?: string };
    if (!patientId || !/^[0-9a-f-]{36}$/i.test(patientId)) {
      return NextResponse.json({ error: "patientId inválido" }, { status: 400 });
    }

    // Validar que el paciente existe
    const supabase = createAdminClient();
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .maybeSingle();
    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_USERNAME no configurado" },
        { status: 500 }
      );
    }

    const token = await createWebLinkToken(patientId);
    return NextResponse.json({
      url: `https://t.me/${botUsername}?start=${token}`,
      expiresInSeconds: 15 * 60,
    });
  } catch (err) {
    console.error("[telegram/link]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
