interface ConfirmationEmailData {
  patientName: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  duration: number;
  procedureName?: string | null;
  procedureDescription?: string | null;
}

export function appointmentConfirmationTemplate(
  data: ConfirmationEmailData
): string {
  const procedureRow = data.procedureName
    ? `
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#666;">Procedimiento</td>
                  <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${data.procedureName}</td>
                </tr>`
    : "";

  const descriptionBlock = data.procedureDescription
    ? `
        <div style="margin:20px 0 0;padding:18px 20px;background:#f8fafc;border-left:4px solid #006194;border-radius:8px;">
          <p style="margin:0 0 6px;font-size:12px;color:#006194;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Detalle del procedimiento</p>
          <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.procedureDescription)}</p>
        </div>`
    : "";

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
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Cita Confirmada</p>
      </td>
    </tr>

    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;">
          Hola <strong>${data.patientName}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6;">
          Tu cita ha sido agendada exitosamente. Aquí están los detalles:
        </p>

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
                </tr>${procedureRow}
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
        </table>${descriptionBlock}

        <div style="margin:24px 0 0;padding:16px 20px;background:#fff8e1;border-radius:10px;border:1px solid #ffe082;">
          <p style="margin:0;font-size:12px;color:#795548;line-height:1.5;">
            <strong>Política de cancelación:</strong> Puedes cancelar o reagendar tu cita
            hasta 24 horas antes desde tu cuenta en nuestra web.
          </p>
        </div>

        <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.5;">
          Si tienes alguna pregunta, no dudes en contactarnos.
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
