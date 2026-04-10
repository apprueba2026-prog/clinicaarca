interface GuestConfirmationEmailData {
  patientName: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  duration: number;
  registerUrl: string;
}

export function appointmentConfirmationGuestTemplate(
  data: GuestConfirmationEmailData
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
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Cita Confirmada</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;">
          Hola <strong>${data.patientName}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6;">
          Tu cita ha sido agendada exitosamente. Aquí están los detalles:
        </p>

        <!-- Detalles -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7fb;border-radius:12px;border:1px solid #d0e8f2;">
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
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#666;">Duración</td>
                  <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${data.duration} minutos</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA: Crear cuenta -->
        <div style="margin:24px 0 0;padding:20px 24px;background:#e8f5e9;border-radius:12px;border:1px solid #c8e6c9;text-align:center;">
          <p style="margin:0 0 12px;font-size:14px;color:#2e7d32;font-weight:600;">
            ¿Quieres gestionar tus citas y recibir recordatorios?
          </p>
          <a href="${data.registerUrl}" style="display:inline-block;padding:12px 28px;background:#006194;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
            Crear mi cuenta
          </a>
          <p style="margin:10px 0 0;font-size:11px;color:#666;">
            Es opcional y toma menos de 1 minuto.
          </p>
        </div>

        <!-- Política -->
        <div style="margin:20px 0 0;padding:16px 20px;background:#fff8e1;border-radius:10px;border:1px solid #ffe082;">
          <p style="margin:0;font-size:12px;color:#795548;line-height:1.5;">
            <strong>¿Necesitas cancelar?</strong> Llámanos al 985 289 689 o
            crea tu cuenta para gestionar tus citas online.
          </p>
        </div>

        <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.5;">
          Si tienes alguna pregunta, no dudes en contactarnos.
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
