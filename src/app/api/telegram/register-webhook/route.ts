/**
 * POST /api/telegram/register-webhook
 *
 * Re-registra el webhook de Telegram usando las env vars actuales
 * de Vercel. Útil cuando el TELEGRAM_WEBHOOK_SECRET fue rotado y
 * Telegram conserva el viejo (todos los updates retornan 401 y se
 * descartan silenciosamente).
 *
 * Solo accesible para admin.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
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
        { error: "Solo admin puede registrar el webhook" },
        { status: 403 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const url = process.env.TELEGRAM_WEBHOOK_URL?.trim();
    const secretRaw = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
    const secret = secretRaw.trim();

    if (!token || !url || !secret) {
      return NextResponse.json(
        {
          error: "Variables de entorno incompletas",
          missing: {
            TELEGRAM_BOT_TOKEN: !token,
            TELEGRAM_WEBHOOK_URL: !url,
            TELEGRAM_WEBHOOK_SECRET: !secret,
          },
        },
        { status: 503 }
      );
    }

    // Telegram acepta secret_token con SOLO [A-Za-z0-9_-] (1-256 chars).
    // Si el secret tiene otros caracteres (=, +, /, ., !, etc.) Telegram
    // RECHAZA el setWebhook silenciosamente y los updates llegan SIN
    // header → el webhook responde 401 y el bot nunca contesta.
    const VALID_SECRET = /^[A-Za-z0-9_-]{1,256}$/;
    if (!VALID_SECRET.test(secret)) {
      return NextResponse.json(
        {
          error:
            "TELEGRAM_WEBHOOK_SECRET contiene caracteres no permitidos por Telegram. Solo se aceptan A-Z, a-z, 0-9, '_' y '-'. Genera uno nuevo con: openssl rand -hex 32",
          secretLength: secret.length,
          hasSpaces: /\s/.test(secretRaw),
          firstInvalidChar:
            (secret.match(/[^A-Za-z0-9_-]/) ?? [null])[0] ?? null,
        },
        { status: 422 }
      );
    }

    // Telegram setWebhook con secret_token
    const params = new URLSearchParams();
    params.append("url", url);
    params.append("secret_token", secret);
    params.append("allowed_updates", JSON.stringify(["message"]));
    params.append("drop_pending_updates", "true");

    const resp = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );
    const result = await resp.json();

    // Confirmar el estado tras el registro
    const infoResp = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const info = await infoResp.json();

    return NextResponse.json({
      registered: result.ok === true,
      registerResult: result,
      currentInfo: info.ok ? info.result : info,
    });
  } catch (err) {
    console.error("[telegram/register-webhook]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
