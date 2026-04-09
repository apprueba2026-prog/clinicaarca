import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Rate limiter nativo en Postgres (sin dependencias externas).
 *
 * Estrategia de defensa en capas:
 *   1. Vercel WAF (edge) — configurado en dashboard, bloquea antes del backend.
 *      Path: /api/ai/chat → 30 req / 15min por IP.
 *      Esto protege contra abuso masivo y NO consume compute.
 *   2. Esta función (server-side) — segunda línea de defensa con lógica adicional
 *      (puede limitar por user_id autenticado en el futuro, no solo IP).
 *
 * Ver supabase/14_rate_limits.sql para la RPC subyacente.
 */

// ⚠️ Plan de evolución del rate limit (etapas):
//   - Etapa de lanzamiento (HOY): 50 / 15min — más margen para usuarios reales
//     que prueban varias veces y para casos donde el bot gasta turns extra.
//   - Tras 3 meses de uso: bajar a 40 / 15min cuando los flujos estén pulidos.
//   - Tras 6 meses: bajar a 30 / 15min (estándar producción).
//
// Ver `feedback_bot_lessons.md` (memoria de Claude) para historial de ajustes.
const DEFAULT_MAX = 50;
const DEFAULT_WINDOW_SECONDS = 15 * 60; // 15 min

export interface RateLimitResult {
  success: boolean;
}

export async function checkRateLimit(
  identifier: string,
  options: { max?: number; windowSeconds?: number } = {}
): Promise<RateLimitResult> {
  const max = options.max ?? DEFAULT_MAX;
  const windowSeconds = options.windowSeconds ?? DEFAULT_WINDOW_SECONDS;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_max: max,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("[ratelimit] Error en RPC:", error.message);
      return { success: true }; // fail-open: no romper el chat por error de rate limit
    }

    return { success: data === true };
  } catch (err) {
    console.error("[ratelimit] Error inesperado:", err);
    return { success: true }; // fail-open
  }
}
