/**
 * GET /api/telegram/debug
 *
 * Diagnóstico de la integración Telegram:
 *  - Estado de las env vars (sin exponer valores).
 *  - Resultado de getWebhookInfo (URL registrada, errores recientes,
 *    cantidad de updates pendientes).
 *  - Conteo de telegram_users vinculados (paciente / doctor).
 *
 * Solo accesible para staff.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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

    const env = {
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME ?? null,
      TELEGRAM_WEBHOOK_SECRET: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL ?? null,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? null,
    };

    let webhookInfo: unknown = null;
    let webhookError: string | null = null;
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
        );
        const json = await res.json();
        webhookInfo = json.ok ? json.result : json;
      } catch (err) {
        webhookError = err instanceof Error ? err.message : String(err);
      }
    } else {
      webhookError = "TELEGRAM_BOT_TOKEN no configurado";
    }

    const admin = createAdminClient();
    const [{ count: doctorsLinked }, { count: patientsLinked }] =
      await Promise.all([
        admin
          .from("telegram_users")
          .select("id", { count: "exact", head: true })
          .eq("linked_entity_type", "doctor")
          .eq("status", "active"),
        admin
          .from("telegram_users")
          .select("id", { count: "exact", head: true })
          .eq("linked_entity_type", "patient")
          .eq("status", "active"),
      ]);

    const { count: pendingTokens } = await admin
      .from("telegram_link_tokens")
      .select("token", { count: "exact", head: true })
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString());

    return NextResponse.json({
      env,
      webhook: webhookInfo,
      webhookError,
      counts: {
        doctorsLinked: doctorsLinked ?? 0,
        patientsLinked: patientsLinked ?? 0,
        pendingTokens: pendingTokens ?? 0,
      },
    });
  } catch (err) {
    console.error("[telegram/debug]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
