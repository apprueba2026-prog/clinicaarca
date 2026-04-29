import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  // En desarrollo, solo loguear si no hay API key configurada
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL SKIP] No RESEND_API_KEY. To: ${to}, Subject: ${subject}`);
    return { success: true, skipped: true };
  }

  try {
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ?? "Clínica Arca <noreply@clinicaarca.com>";

    console.log(`[EMAIL] Enviando a: ${to}, Desde: ${fromEmail}, Asunto: ${subject}`);

    const { data, error } = await getResend().emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[EMAIL ERROR] Resend devolvió error:", JSON.stringify(error, null, 2));
      console.error("[EMAIL ERROR] Verifica que RESEND_FROM_EMAIL use un dominio verificado en Resend.");
      console.error("[EMAIL ERROR] Si usas plan gratuito, solo puedes enviar desde 'onboarding@resend.dev' o un dominio verificado.");
      return { success: false, error };
    }

    console.log(`[EMAIL OK] Enviado exitosamente. ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[EMAIL ERROR] Excepción al enviar:", err);
    return { success: false, error: err };
  }
}
