/**
 * POST /api/telegram/test-send  (admin only)
 *
 * Envía un mensaje de prueba directamente a un chatId. Permite
 * descartar problemas con el TELEGRAM_BOT_TOKEN o la API de Telegram:
 * si esto NO falla, el bot puede ENVIAR; entonces el problema está
 * en RECIBIR (webhook).
 *
 * Body: { chatId: number | string, text?: string }
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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
    if (!profile || !profile.is_active || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Solo admin" },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      chatId?: number | string;
      text?: string;
    };
    if (!body.chatId) {
      return NextResponse.json(
        { error: "Falta chatId. Envía { chatId: <numero> }" },
        { status: 400 }
      );
    }

    const text =
      body.text ??
      "🧪 Mensaje de prueba desde Clínica Arca. Si lo recibes, el bot puede ENVIAR. Si /ayuda no responde, el problema está en RECIBIR (webhook).";

    const result = await sendTelegramMessage(body.chatId, text, {
      parseMode: "HTML",
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[telegram/test-send]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
