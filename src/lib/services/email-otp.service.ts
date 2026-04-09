import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send-email";
import { bookingOtpTemplate } from "@/lib/email/templates/booking-otp";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const emailOtpService = {
  /**
   * Genera y envía un código OTP por email.
   * Invalida códigos previos no usados del mismo email/purpose.
   */
  async generateOTP(
    email: string,
    conversationId: string | null,
    purpose: "booking" | "login" = "booking"
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createAdminClient();

    // Invalidar OTPs previos del mismo email/purpose
    await supabase
      .from("email_otps")
      .update({ used_at: new Date().toISOString() })
      .eq("email", email.toLowerCase())
      .eq("purpose", purpose)
      .is("used_at", null);

    const code = generate6DigitCode();
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    const { error } = await supabase.from("email_otps").insert({
      email: email.toLowerCase(),
      code,
      purpose,
      conversation_id: conversationId,
      expires_at: expiresAt,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Enviar email
    const html = bookingOtpTemplate({ code, expiresInMinutes: OTP_EXPIRY_MINUTES });
    const result = await sendEmail({
      to: email,
      subject: "Tu código de verificación — Clínica Arca",
      html,
    });

    if (!result.success) {
      return { success: false, error: "No se pudo enviar el email" };
    }

    return { success: true };
  },

  /**
   * Verifica un código OTP. Si es válido, lo marca como usado.
   * Si falla, incrementa attempts; si attempts >= MAX_ATTEMPTS, queda bloqueado.
   */
  async verifyOTP(
    email: string,
    code: string
  ): Promise<{ valid: boolean; error?: string }> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("email_otps")
      .select("id, code, expires_at, attempts, used_at")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { valid: false, error: error.message };

    if (!data) {
      // Buscar el último OTP del email para incrementar attempts
      const { data: latest } = await supabase
        .from("email_otps")
        .select("id, attempts")
        .eq("email", email.toLowerCase())
        .is("used_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest) {
        const newAttempts = (latest.attempts as number) + 1;
        await supabase
          .from("email_otps")
          .update({
            attempts: newAttempts,
            ...(newAttempts >= MAX_ATTEMPTS && {
              used_at: new Date().toISOString(),
            }),
          })
          .eq("id", latest.id);

        if (newAttempts >= MAX_ATTEMPTS) {
          return {
            valid: false,
            error:
              "Demasiados intentos fallidos. Solicita un código nuevo.",
          };
        }
      }
      return { valid: false, error: "Código incorrecto" };
    }

    // Validar expiración
    if (new Date(data.expires_at as string) < new Date()) {
      return { valid: false, error: "El código expiró. Solicita uno nuevo." };
    }

    // Marcar usado
    await supabase
      .from("email_otps")
      .update({ used_at: new Date().toISOString() })
      .eq("id", data.id);

    return { valid: true };
  },
};
