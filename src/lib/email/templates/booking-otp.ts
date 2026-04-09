interface BookingOtpData {
  code: string;
  expiresInMinutes: number;
}

export function bookingOtpTemplate(data: BookingOtpData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e0e0e0;">
    <tr>
      <td style="background:#006194;padding:28px 32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Clínica Arca</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Verificación de Email</p>
      </td>
    </tr>

    <tr>
      <td style="padding:32px;text-align:center;">
        <p style="margin:0 0 24px;font-size:15px;color:#1a1a1a;">
          Estás a punto de reservar una cita en Clínica Arca.<br>
          Ingresa este código en el chat para confirmar tu email:
        </p>

        <div style="margin:24px 0;padding:20px;background:#f0f7fb;border:2px dashed #006194;border-radius:12px;">
          <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:8px;color:#006194;font-family:monospace;">
            ${data.code}
          </p>
        </div>

        <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.5;">
          Este código vence en <strong>${data.expiresInMinutes} minutos</strong>.<br>
          Si no solicitaste este código, puedes ignorar este email.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
        <p style="margin:0;font-size:11px;color:#999;">
          Por seguridad, nunca compartas este código con nadie.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
