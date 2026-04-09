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
    const { data, error } = await getResend().emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[EMAIL ERROR]", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[EMAIL ERROR]", err);
    return { success: false, error: err };
  }
}
