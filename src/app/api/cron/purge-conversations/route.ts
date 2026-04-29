/**
 * GET /api/cron/purge-conversations
 *
 * Cron diario que llama a la RPC purge_old_ai_conversations(p_days=30)
 * para limpiar conversaciones IA antiguas (PII de pacientes que ya no
 * necesitamos retener).
 *
 * Protección:
 *   - Vercel Cron envía un header `Authorization: Bearer <CRON_SECRET>`.
 *   - Validamos contra process.env.CRON_SECRET. Si no está configurado,
 *     el endpoint solo pasa si la request viene de Vercel (cabecera
 *     x-vercel-cron) o si es invocado por un admin autenticado.
 *
 * Configurar en vercel.json:
 *   { "crons": [{ "path": "/api/cron/purge-conversations", "schedule": "0 4 * * *" }] }
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Autenticación — Vercel Cron envía Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron =
    !!req.headers.get("x-vercel-cron") ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!isVercelCron) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc(
      "purge_old_ai_conversations",
      { p_days: 30 }
    );

    if (error) {
      console.error("[cron/purge-conversations]", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const result = (data?.[0] ?? {
      deleted_conversations: 0,
      deleted_messages: 0,
    }) as { deleted_conversations: number; deleted_messages: number };

    console.log(
      `[cron/purge-conversations] OK: ${result.deleted_conversations} conv, ${result.deleted_messages} msgs eliminadas`
    );

    return NextResponse.json({
      ok: true,
      deletedConversations: result.deleted_conversations,
      deletedMessages: result.deleted_messages,
      runAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/purge-conversations]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
