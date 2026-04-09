interface MagicLinkData {
  patientName: string;
  magicLink: string;
}

export function magicLinkTemplate(data: MagicLinkData): string {
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
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Acceso a tu portal</p>
      </td>
    </tr>

    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;">
          Hola <strong>${data.patientName}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6;">
          Hemos creado una cuenta para ti en Clínica Arca. Desde tu portal puedes
          ver tus citas, reprogramar, descargar comprobantes y mucho más.
        </p>

        <div style="text-align:center;margin:32px 0;">
          <a href="${data.magicLink}" style="display:inline-block;padding:14px 32px;background:#006194;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">
            Acceder a mi portal
          </a>
        </div>

        <p style="margin:24px 0 0;font-size:12px;color:#888;line-height:1.5;">
          Este enlace es de un solo uso y vence en 24 horas. Si el botón no
          funciona, copia y pega esta URL en tu navegador:<br>
          <span style="word-break:break-all;color:#006194;">${data.magicLink}</span>
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
        <p style="margin:0;font-size:11px;color:#999;">
          Si no esperabas este correo, puedes ignorarlo.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
