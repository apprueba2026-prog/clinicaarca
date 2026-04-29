/**
 * GET /api/telegram/debug
 *
 * Diagnóstico de la integración Telegram. SOLO admin.
 *  - Estado de las env vars (sin exponer valores secretos).
 *  - Conexión real con Telegram API (getMe + getWebhookInfo).
 *  - Conteo de telegram_users vinculados.
 *  - Últimos 5 tokens recientes con su step y si recibieron chat_id
 *    (clave para diagnosticar por qué la vinculación no se completa).
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
    if (!profile || !profile.is_active || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Solo admin puede acceder a este diagnóstico" },
        { status: 403 }
      );
    }

    const env = {
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME ?? null,
      TELEGRAM_WEBHOOK_SECRET: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL ?? null,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? null,
    };

    let botInfo: unknown = null;
    let webhookInfo: unknown = null;
    let webhookError: string | null = null;

    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const [meRes, hookRes] = await Promise.all([
          fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
          ),
          fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
          ),
        ]);
        const meJson = await meRes.json();
        const hookJson = await hookRes.json();
        botInfo = meJson.ok
          ? {
              id: meJson.result.id,
              username: meJson.result.username,
              first_name: meJson.result.first_name,
              can_join_groups: meJson.result.can_join_groups,
              can_read_all_group_messages:
                meJson.result.can_read_all_group_messages,
            }
          : meJson;
        webhookInfo = hookJson.ok ? hookJson.result : hookJson;
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

    // Detalle de los últimos 5 tokens — diagnóstico clave
    const { data: recentTokensRaw } = await admin
      .from("telegram_link_tokens")
      .select(
        "token, link_role, doctor_id, patient_id, telegram_chat_id, step, used_at, expires_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5);

    const recentTokens = (recentTokensRaw ?? []).map((t) => ({
      token_short:
        typeof t.token === "string"
          ? `${t.token.slice(0, 8)}...`
          : null,
      role: t.link_role,
      has_doctor: !!t.doctor_id,
      has_patient: !!t.patient_id,
      has_chat_id: !!t.telegram_chat_id,
      step: t.step,
      consumed: !!t.used_at,
      expired: t.expires_at
        ? new Date(t.expires_at as string).getTime() < Date.now()
        : false,
      created_at: t.created_at,
    }));

    // Extraer errores del webhook de Telegram (si los hay)
    const wh = webhookInfo as
      | {
          last_error_date?: number;
          last_error_message?: string;
          last_synchronization_error_date?: number;
          pending_update_count?: number;
        }
      | null;
    const lastError =
      wh && wh.last_error_message
        ? {
            message: wh.last_error_message,
            when: wh.last_error_date
              ? new Date(wh.last_error_date * 1000).toISOString()
              : null,
          }
        : null;

    // Diagnóstico interpretado: ¿qué le pasó a los tokens pendientes?
    const interpret = (() => {
      if (lastError) {
        return `Telegram registró un error reciente al entregar updates al webhook: "${lastError.message}". Usa el botón 'Re-registrar webhook'.`;
      }
      if (!recentTokens.length) {
        return "No hay tokens recientes. Genera uno desde el modal de doctor.";
      }
      const latest = recentTokens[0];
      if (latest.consumed) {
        return "El último token SÍ se consumió. Si counts.doctorsLinked sigue en 0, revisa la BD manualmente.";
      }
      if (latest.expired) {
        return "El último token expiró sin usarse. Genera uno nuevo y abre el enlace ANTES de 15 min.";
      }
      if (!latest.has_chat_id) {
        return "El token NUNCA recibió un chat_id. Posibles causas: (1) la doctora no presionó 'Iniciar/Start' después de abrir el enlace; (2) el webhook está rechazando los updates de Telegram. Revisa el campo 'lastError' arriba; si es null, también revisa los logs de Vercel filtrados por '[telegram webhook]'.";
      }
      return "El token recibió chat_id pero no se consumió. Revisa los logs del webhook en Vercel.";
    })();

    return NextResponse.json({
      env,
      bot: botInfo,
      webhook: webhookInfo,
      webhookError,
      lastError,
      counts: {
        doctorsLinked: doctorsLinked ?? 0,
        patientsLinked: patientsLinked ?? 0,
        pendingTokens: pendingTokens ?? 0,
      },
      recentTokens,
      diagnosis: interpret,
    });
  } catch (err) {
    console.error("[telegram/debug]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
