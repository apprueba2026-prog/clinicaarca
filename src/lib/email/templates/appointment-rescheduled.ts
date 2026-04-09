interface RescheduledEmailData {
  patientName: string;
  doctorName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
}

export function appointmentRescheduledTemplate(
  data: RescheduledEmailData
): string {
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
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Cita Reprogramada</p>
      </td>
    </tr>

    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;">
          Hola <strong>${data.patientName}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6;">
          Tu cita con ${data.doctorName} ha sido reprogramada exitosamente.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-radius:12px;border:1px solid #ffe082;margin-bottom:16px;">
          <tr>
            <td style="padding:16px 24px;">
              <p style="margin:0 0 4px;font-size:11px;color:#795548;font-weight:700;text-transform:uppercase;">Cita anterior</p>
              <p style="margin:0;font-size:14px;color:#795548;text-decoration:line-through;">
                ${data.oldDate} • ${data.oldTime}
              </p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f5e9;border-radius:12px;border:1px solid #c8e6c9;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:11px;color:#2e7d32;font-weight:700;text-transform:uppercase;">Nueva cita</p>
              <p style="margin:0;font-size:16px;color:#1a1a1a;font-weight:700;">
                ${data.newDate} • ${data.newTime}
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.5;">
          Recibirás un recordatorio automático 24 horas antes de tu nueva cita.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
        <p style="margin:0;font-size:11px;color:#999;">
          Clínica Arca — Tu salud dental, nuestra prioridad
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
