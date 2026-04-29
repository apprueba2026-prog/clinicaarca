import "server-only";

/**
 * Cloudflare Turnstile — verificación server-side del token captcha.
 *
 * Setup:
 *   1. Crear site en https://dash.cloudflare.com/?to=/:account/turnstile
 *   2. Modo: invisible (preferido) o managed.
 *   3. Hostname: clinicaarca.com
 *   4. Configurar en Vercel:
 *      - NEXT_PUBLIC_TURNSTILE_SITE_KEY (público)
 *      - TURNSTILE_SECRET_KEY (privado)
 *
 * Comportamiento sin keys configuradas:
 *   En desarrollo o si las env vars no están presentes, la verificación
 *   queda DESHABILITADA (passes through). Esto evita bloquear el chat
 *   antes de que el usuario complete el setup. En producción, una vez
 *   configuradas, el chat las exige.
 */

export interface TurnstileResult {
  success: boolean;
  reason?: string;
}

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(
  token: string | null,
  remoteIp?: string | null
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Sin secret configurado: bypass (modo dev / setup pendiente).
  // Logueamos solo una vez por cold start para no spammear.
  if (!secret) {
    if (!warnedNoSecret) {
      console.warn(
        "[turnstile] TURNSTILE_SECRET_KEY no configurado — captcha deshabilitado"
      );
      warnedNoSecret = true;
    }
    return { success: true };
  }

  if (!token) {
    return { success: false, reason: "missing_token" };
  }

  try {
    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", token);
    if (remoteIp) body.append("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
    });
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!data.success) {
      return {
        success: false,
        reason: (data["error-codes"] ?? []).join(",") || "verify_failed",
      };
    }
    return { success: true };
  } catch (err) {
    console.error("[turnstile] verify error:", err);
    // fail-closed para seguridad: si la verificación falla, bloqueamos.
    return { success: false, reason: "verify_exception" };
  }
}

let warnedNoSecret = false;
