/**
 * Plantillas de mensajes Telegram para Noé.
 *
 * Todos los mensajes usan MarkdownV2 (formato por defecto en client.ts).
 * OBLIGATORIO escapar los caracteres especiales: _ * [ ] ( ) ~ ` > # + - = | { } . !
 * La API de Telegram rechaza el mensaje si algún carácter no está escapado.
 */

const MD2_SPECIAL = /[_*\[\]()~`>#+\-=|{}.!\\]/g;

export function escapeMd2(text: string | null | undefined): string {
  if (!text) return "";
  return String(text).replace(MD2_SPECIAL, (m) => `\\${m}`);
}

// ------------------------------------------------------------
// Plantillas
// ------------------------------------------------------------

export function buildWelcomeMessage(firstName?: string): string {
  const name = firstName ? `, ${escapeMd2(firstName)}` : "";
  return [
    `¡Hola${name}\\! 🦷 Soy *Noé*, el asistente virtual de *Clínica Arca*\\.`,
    ``,
    `Envíame /vincular para conectar tu cuenta y recibir recordatorios de tus citas\\.`,
    ``,
    `Comandos disponibles:`,
    `• /vincular — conectar tu cuenta`,
    `• /desvincular — dejar de recibir mensajes`,
    `• /ayuda — ver esta lista`,
  ].join("\n");
}

export function buildLinkConfirmation(patientFirstName: string): string {
  return [
    `✅ *Vinculación exitosa*`,
    ``,
    `¡Listo, ${escapeMd2(patientFirstName)}\\! A partir de ahora recibirás aquí los recordatorios de tus citas en *Clínica Arca*\\.`,
    ``,
    `Si deseas dejar de recibir mensajes, escribe /desvincular en cualquier momento\\.`,
  ].join("\n");
}

export interface ReminderAppointment {
  patientFirstName: string;
  doctorFullName: string;
  specialty?: string | null;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  room?: string | null;
}

export function buildReminderMessage(a: ReminderAppointment): string {
  const fecha = formatLimaDate(a.scheduledDate);
  const hora = a.startTime.slice(0, 5);
  const lines = [
    `🦷 *Recordatorio de cita — Clínica Arca*`,
    ``,
    `Hola ${escapeMd2(a.patientFirstName)}, te recordamos tu cita de mañana:`,
    ``,
    `📅 *Fecha:* ${escapeMd2(fecha)}`,
    `🕒 *Hora:* ${escapeMd2(hora)}`,
    `👨‍⚕️ *Doctor\\(a\\):* ${escapeMd2(a.doctorFullName)}`,
  ];
  if (a.specialty) lines.push(`💠 *Especialidad:* ${escapeMd2(a.specialty)}`);
  if (a.room) lines.push(`🚪 *Consultorio:* ${escapeMd2(a.room)}`);
  lines.push(
    ``,
    `Si no puedes asistir, por favor avísanos con anticipación llamando a recepción\\.`,
    ``,
    `📍 Av\\. Ejemplo 123, Lima`,
    `📞 \\+51 985 289 689`
  );
  return lines.join("\n");
}

export interface DoctorDailyReportAppointment {
  startTime: string; // HH:MM
  endTime: string;
  patientFullName: string;
  procedure?: string | null;
  status: string;
  room?: string | null;
}

export function buildDoctorDailyReport(
  doctorFirstName: string,
  date: string, // YYYY-MM-DD
  appointments: DoctorDailyReportAppointment[]
): string {
  const fecha = formatLimaDate(date);
  const header = [
    `📋 *Agenda del día — Clínica Arca*`,
    ``,
    `Buenos días, Dr\\(a\\)\\. ${escapeMd2(doctorFirstName)}\\. Esta es tu agenda para *${escapeMd2(fecha)}*\\:`,
    ``,
  ];
  if (appointments.length === 0) {
    header.push(`_No tienes citas programadas para hoy\\._`);
    return header.join("\n");
  }
  const body = appointments.map((a, i) => {
    const start = a.startTime.slice(0, 5);
    const end = a.endTime.slice(0, 5);
    const lines = [
      `*${i + 1}\\.* ${escapeMd2(start)}–${escapeMd2(end)} · ${escapeMd2(a.patientFullName)}`,
    ];
    if (a.procedure) lines.push(`   💠 ${escapeMd2(a.procedure)}`);
    if (a.room) lines.push(`   🚪 ${escapeMd2(a.room)}`);
    lines.push(`   🏷️ ${escapeMd2(a.status)}`);
    return lines.join("\n");
  });
  return [...header, ...body, ``, `Total: *${appointments.length}* cita\\(s\\)\\.`].join("\n");
}

export function buildHelpMessage(): string {
  return [
    `*Comandos disponibles:*`,
    ``,
    `• /vincular — conectar tu cuenta con tu DNI`,
    `• /desvincular — dejar de recibir mensajes`,
    `• /ayuda — mostrar este mensaje`,
    ``,
    `¿Necesitas más ayuda? Escríbenos por el chat de la web o llámanos al \\+51 985 289 689\\.`,
  ].join("\n");
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function formatLimaDate(iso: string): string {
  // iso: YYYY-MM-DD — construimos sin Date() para evitar timezone shifts
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
