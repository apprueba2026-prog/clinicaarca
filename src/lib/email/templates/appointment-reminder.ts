interface ReminderEmailData {
  patientName: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
}

export function appointmentReminderTemplate(
  data: ReminderEmailData
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
    <!-- Header -->
    <tr>
      <td style="background:#006194;padding:28px 32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Clínica Arca</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Recordatorio de Cita</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;">
          Hola <strong>${data.patientName}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6;">
          Te recordamos que tienes una cita programada para <strong>mañana</strong>.
        </p>

        <!-- Detalles -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f5e9;border-radius:12px;border:1px solid #c8e6c9;">
          <tr>
            <td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#666;width:120px;">Especialista</td>
                  <td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${data.doctorName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#666;">Especialidad</td>
                  <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${data.specialty}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#666;">Fecha</td>
                  <td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${data.date}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#666;">Hora</td>
                  <td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${data.time}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.5;">
          Te esperamos. Si no puedes asistir, cancela tu cita desde tu cuenta
          con al menos 24 horas de anticipación.
        </p>
      </td>
    </tr>

    <!-- Footer -->
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
