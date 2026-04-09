import "server-only";
import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send-email";
import { appointmentConfirmationTemplate } from "@/lib/email/templates/appointment-confirmation";
import { appointmentCancelledTemplate } from "@/lib/email/templates/appointment-cancelled";
import { appointmentRescheduledTemplate } from "@/lib/email/templates/appointment-rescheduled";
import { magicLinkTemplate } from "@/lib/email/templates/magic-link";
import { emailOtpService } from "@/lib/services/email-otp.service";
import type { ProcedureCategory } from "@/lib/types/enums";

// ============================================================================
// CONSTANTES Y HELPERS
// ============================================================================

const SPECIALTY_LABELS: Record<ProcedureCategory, string> = {
  general: "Odontología General",
  odontopediatria: "Odontopediatría",
  implantes: "Implantes Dentales",
  ortodoncia: "Ortodoncia",
  sedacion: "Sedación Dental",
  cirugia: "Cirugía Oral",
  estetica: "Estética Dental",
  endodoncia: "Endodoncia",
  periodoncia: "Periodoncia",
};

const SPECIALTY_VALUES = Object.keys(SPECIALTY_LABELS) as ProcedureCategory[];

function isValidSpecialty(s: string): s is ProcedureCategory {
  return (SPECIALTY_VALUES as string[]).includes(s);
}

// DNI peruano: 8 dígitos numéricos
const dniSchema = z
  .string()
  .regex(/^\d{8}$/, "DNI peruano debe ser exactamente 8 dígitos numéricos");

/**
 * Devuelve la fecha actual en formato YYYY-MM-DD según el timezone de Lima (America/Lima).
 * IMPORTANTE: no usar new Date().toISOString() porque siempre devuelve UTC y rompe
 * en horarios límite (Lima 22:00-23:59 = UTC 03:00-04:59 del día siguiente).
 */
function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
  }).format(new Date());
}

/**
 * Retorna la fecha actual de Lima formateada en español, ej:
 * "jueves, 9 de abril de 2026"
 */
export function todayLimaFormatted(): string {
  const formatter = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatter.format(new Date());
}

function formatDateES(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ============================================================================
// CONTEXTO POR REQUEST (conversationId, etc.)
// ============================================================================

export interface ToolContext {
  conversationId: string | null;
}

// ============================================================================
// TOOL DECLARATIONS (lo que ve el modelo)
// ============================================================================

export const ASSISTANT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "listSpecialties",
    description:
      "Lista las especialidades dentales disponibles en la clínica.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "listDoctorsForSpecialty",
    description:
      "Devuelve los doctores que cubren una especialidad dental específica.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        specialty: {
          type: SchemaType.STRING,
          description:
            "Categoría: general, odontopediatria, implantes, ortodoncia, sedacion, cirugia, estetica, endodoncia, periodoncia",
        },
      },
      required: ["specialty"],
    },
  },
  {
    name: "getAvailableSlots",
    description:
      "Devuelve horarios libres del doctor. Modos:\n- Sin args extra: muestra 5 días × 3 slots representativos (mañana/medio/tarde) desde hoy.\n- Con dateFrom: enfoca a partir de esa fecha (5 días × 3 slots).\n- Con dateFrom + preferredTime: devuelve TODOS los slots de ESE día y marca exactMatch si la hora pedida está libre.\n\nUsar SIEMPRE preferredTime cuando el usuario diga una hora específica (ej. '5pm', '17:00', 'a las 11 de la mañana').",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        doctorId: { type: SchemaType.STRING, description: "UUID del doctor." },
        dateFrom: {
          type: SchemaType.STRING,
          description:
            "Opcional. Fecha específica YYYY-MM-DD. Si se omite, busca desde hoy.",
        },
        preferredTime: {
          type: SchemaType.STRING,
          description:
            "Opcional. Hora específica HH:MM (24h) que el usuario solicitó. Cuando se proporciona, devuelve TODOS los slots del día de dateFrom y marca exactMatch.",
        },
      },
      required: ["doctorId"],
    },
  },
  {
    name: "createOrFindPatient",
    description:
      "Busca un paciente por DNI peruano (8 dígitos). Si existe, devuelve sus datos. Si no, créalo con firstName, lastName, phone y email.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        dni: { type: SchemaType.STRING, description: "DNI peruano (8 dígitos)." },
        firstName: { type: SchemaType.STRING, description: "Solo si el paciente NO existe." },
        lastName: { type: SchemaType.STRING, description: "Solo si el paciente NO existe." },
        phone: { type: SchemaType.STRING, description: "Solo si el paciente NO existe." },
        email: { type: SchemaType.STRING, description: "Email del paciente. Recomendado." },
      },
      required: ["dni"],
    },
  },
  {
    name: "requestEmailOTP",
    description:
      "Envía un código OTP de 6 dígitos al email del paciente para verificarlo. SIEMPRE llamar esta tool ANTES de createAppointment para confirmar que el email existe y es del paciente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        email: { type: SchemaType.STRING, description: "Email del paciente." },
      },
      required: ["email"],
    },
  },
  {
    name: "verifyEmailOTP",
    description:
      "Verifica el código OTP que el paciente ingresó. Si es válido, puedes proceder a llamar createAppointment con otpVerified: true.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        email: { type: SchemaType.STRING, description: "Email del paciente." },
        code: { type: SchemaType.STRING, description: "Código de 6 dígitos que ingresó el paciente." },
      },
      required: ["email", "code"],
    },
  },
  {
    name: "createAppointment",
    description:
      "Crea una cita en la base de datos. REQUIERE que el email haya sido verificado previamente con verifyEmailOTP (otpVerified: true). Envía email de confirmación y, si el paciente es nuevo, magic link al portal.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        patientId: { type: SchemaType.STRING, description: "UUID del paciente." },
        doctorId: { type: SchemaType.STRING, description: "UUID del doctor." },
        scheduledDate: {
          type: SchemaType.STRING,
          description: "Fecha en formato YYYY-MM-DD.",
        },
        startTime: {
          type: SchemaType.STRING,
          description: "Hora inicio HH:MM (24h).",
        },
        endTime: {
          type: SchemaType.STRING,
          description: "Hora fin HH:MM (24h).",
        },
        specialty: {
          type: SchemaType.STRING,
          description: "Categoría de la especialidad reservada.",
        },
        otpVerified: {
          type: SchemaType.BOOLEAN,
          description:
            "DEBE ser true. Marcar solo después de verifyEmailOTP exitoso.",
        },
      },
      required: [
        "patientId",
        "doctorId",
        "scheduledDate",
        "startTime",
        "endTime",
        "otpVerified",
      ],
    },
  },
  {
    name: "cancelAppointment",
    description:
      "Cancela una cita existente. Requiere el ID de la cita y el DNI del paciente como verificación.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        appointmentId: { type: SchemaType.STRING, description: "UUID de la cita." },
        dni: { type: SchemaType.STRING, description: "DNI del paciente (8 dígitos)." },
      },
      required: ["appointmentId", "dni"],
    },
  },
  {
    name: "rescheduleAppointment",
    description:
      "Reprograma una cita a una nueva fecha/hora. Valida que el nuevo slot esté disponible.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        appointmentId: { type: SchemaType.STRING, description: "UUID de la cita actual." },
        dni: { type: SchemaType.STRING, description: "DNI del paciente." },
        newDate: { type: SchemaType.STRING, description: "Nueva fecha YYYY-MM-DD." },
        newStartTime: { type: SchemaType.STRING, description: "Nueva hora inicio HH:MM." },
        newEndTime: { type: SchemaType.STRING, description: "Nueva hora fin HH:MM." },
      },
      required: ["appointmentId", "dni", "newDate", "newStartTime", "newEndTime"],
    },
  },
  {
    name: "getMyAppointments",
    description:
      "Lista las citas próximas de un paciente identificado por DNI. Solo lectura.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        dni: { type: SchemaType.STRING, description: "DNI del paciente (8 dígitos)." },
      },
      required: ["dni"],
    },
  },
  {
    name: "getClinicInfo",
    description:
      "Devuelve información oficial de la clínica sobre un tema específico (dirección, horarios, teléfono, seguros, servicios, cómo llegar, parking).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        topic: {
          type: SchemaType.STRING,
          description:
            "Uno de: address, hours, phone, insurance, services, how_to_arrive, parking",
        },
      },
      required: ["topic"],
    },
  },
];

// ============================================================================
// HANDLERS
// ============================================================================

// ----- listSpecialties -----
async function listSpecialties() {
  return {
    specialties: SPECIALTY_VALUES.map((value) => ({
      value,
      label: SPECIALTY_LABELS[value],
    })),
  };
}

// ----- listDoctorsForSpecialty -----
const listDoctorsArgs = z.object({ specialty: z.string() });

async function listDoctorsForSpecialty(args: unknown) {
  const { specialty } = listDoctorsArgs.parse(args);
  if (!isValidSpecialty(specialty)) {
    return { error: `Especialidad inválida: ${specialty}`, doctors: [] };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("doctors")
    .select(
      `id, specialties, consultation_duration_minutes,
       profile:profiles(first_name, last_name)`
    )
    .eq("is_public", true)
    .contains("specialties", [specialty]);

  if (error) return { error: error.message, doctors: [] };

  const doctors = (data ?? [])
    .map((d) => {
      const profile = d.profile as unknown as
        | { first_name: string; last_name: string }
        | null;
      if (!profile) return null;
      return {
        id: d.id as string,
        name: `Dr(a). ${profile.first_name} ${profile.last_name}`,
        durationMinutes: (d.consultation_duration_minutes as number) ?? 30,
      };
    })
    .filter(Boolean);

  return { doctors };
}

// ----- getAvailableSlots -----
const getSlotsArgs = z.object({
  doctorId: z.string().uuid(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  preferredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

const MAX_SLOTS_PER_DAY = 3;
const MAX_DAYS = 5;

type RpcSlot = { slot_start: string; slot_end: string };

const dayNamesES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function dayNameOf(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return dayNamesES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

async function getAvailableSlots(args: unknown) {
  const parsed = getSlotsArgs.parse(args);
  const supabase = createAdminClient();

  const today = todayISO();
  let startISO = parsed.dateFrom ?? today;
  if (startISO < today) startISO = today;

  // ======= MODO 1: preferredTime → devolver TODOS los slots de ESE día =======
  if (parsed.preferredTime) {
    const { data, error } = await supabase.rpc("get_available_slots", {
      p_doctor_id: parsed.doctorId,
      p_date: startISO,
      p_duration_minutes: 30,
    });

    if (error) {
      return { error: error.message, day: null };
    }

    const daySlots = ((data ?? []) as RpcSlot[]).map((s) => ({
      startTime: s.slot_start.slice(0, 5),
      endTime: s.slot_end.slice(0, 5),
    }));

    if (daySlots.length === 0) {
      return {
        day: {
          date: startISO,
          dayOfWeek: dayNameOf(startISO),
          slots: [],
        },
        exactMatch: null,
        message:
          "No hay horarios disponibles en esa fecha. Sugiere otro día al usuario.",
      };
    }

    // Buscar coincidencia exacta con preferredTime
    const exactMatch = daySlots.find(
      (s) => s.startTime === parsed.preferredTime
    );

    // Calcular alternativas más cercanas (las 3 con menor diferencia en minutos)
    const [ph, pm] = parsed.preferredTime.split(":").map(Number);
    const targetMin = ph * 60 + pm;
    const ranked = [...daySlots]
      .map((s) => {
        const [sh, sm] = s.startTime.split(":").map(Number);
        return { ...s, _diff: Math.abs(sh * 60 + sm - targetMin) };
      })
      .sort((a, b) => a._diff - b._diff)
      .slice(0, 5)
      .map(({ _diff: _, ...rest }) => rest);

    return {
      day: {
        date: startISO,
        dayOfWeek: dayNameOf(startISO),
        totalAvailable: daySlots.length,
      },
      exactMatch: exactMatch ?? null,
      closestSlots: ranked,
      note: exactMatch
        ? "El horario exacto pedido está libre. Confirma al usuario."
        : "El horario exacto NO está libre. Ofrece las alternativas en closestSlots ordenadas de la más cercana a la más lejana.",
    };
  }

  // ======= MODO 2: sin preferredTime → 5 días × 3 slots representativos =======
  const result: Record<
    string,
    { date: string; dayOfWeek: string; slots: Array<{ startTime: string; endTime: string }> }
  > = {};

  const [sy, sm, sd] = startISO.split("-").map(Number);
  const startDate = new Date(Date.UTC(sy, sm - 1, sd));

  for (let i = 0; i < MAX_DAYS; i++) {
    const cur = new Date(startDate);
    cur.setUTCDate(cur.getUTCDate() + i);
    const dateStr = cur.toISOString().split("T")[0];
    const dayName = dayNamesES[cur.getUTCDay()];

    const { data, error } = await supabase.rpc("get_available_slots", {
      p_doctor_id: parsed.doctorId,
      p_date: dateStr,
      p_duration_minutes: 30,
    });

    if (error) continue;

    const daySlots = (data ?? []) as RpcSlot[];
    if (daySlots.length === 0) continue;

    const sample: Array<{ startTime: string; endTime: string }> = [];
    if (daySlots.length <= MAX_SLOTS_PER_DAY) {
      for (const s of daySlots) {
        sample.push({
          startTime: s.slot_start.slice(0, 5),
          endTime: s.slot_end.slice(0, 5),
        });
      }
    } else {
      const indices = [0, Math.floor(daySlots.length / 2), daySlots.length - 1];
      for (const idx of indices) {
        const s = daySlots[idx];
        sample.push({
          startTime: s.slot_start.slice(0, 5),
          endTime: s.slot_end.slice(0, 5),
        });
      }
    }

    result[dateStr] = { date: dateStr, dayOfWeek: dayName, slots: sample };
  }

  return {
    days: Object.values(result),
    note: "Si el usuario menciona una HORA específica, vuelve a llamar getAvailableSlots con dateFrom Y preferredTime para validar exactamente esa hora.",
  };
}

// ----- createOrFindPatient -----
const findPatientArgs = z.object({
  dni: dniSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

async function createOrFindPatient(args: unknown) {
  const parsed = findPatientArgs.parse(args);
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("patients")
    .select("id, dni, first_name, last_name, email, phone, auth_user_id")
    .eq("dni", parsed.dni)
    .maybeSingle();

  if (existing) {
    return {
      found: true,
      patient: {
        id: existing.id,
        dni: existing.dni,
        firstName: existing.first_name,
        lastName: existing.last_name,
        email: existing.email,
        phone: existing.phone,
        hasAccount: !!existing.auth_user_id,
      },
    };
  }

  if (!parsed.firstName || !parsed.lastName || !parsed.phone) {
    return {
      found: false,
      patient: null,
      missingFields: ["firstName", "lastName", "phone"].filter(
        (f) => !(parsed as Record<string, unknown>)[f]
      ),
    };
  }

  const { data: created, error } = await supabase
    .from("patients")
    .insert({
      dni: parsed.dni,
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      phone: parsed.phone,
      email: parsed.email ?? null,
      status: "new",
    })
    .select("id, dni, first_name, last_name, email, phone")
    .single();

  if (error) return { found: false, patient: null, error: error.message };

  return {
    found: false,
    created: true,
    patient: {
      id: created.id,
      dni: created.dni,
      firstName: created.first_name,
      lastName: created.last_name,
      email: created.email,
      phone: created.phone,
      hasAccount: false,
    },
  };
}

// ----- requestEmailOTP -----
const requestOtpArgs = z.object({ email: z.string().email() });

async function requestEmailOTP(args: unknown, ctx: ToolContext) {
  const { email } = requestOtpArgs.parse(args);
  const result = await emailOtpService.generateOTP(
    email,
    ctx.conversationId,
    "booking"
  );
  if (!result.success) {
    return { sent: false, error: result.error ?? "Error enviando OTP" };
  }
  return {
    sent: true,
    message: "Código enviado al email. Pídele al usuario que lo ingrese.",
  };
}

// ----- verifyEmailOTP -----
const verifyOtpArgs = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

async function verifyEmailOTP(args: unknown) {
  const { email, code } = verifyOtpArgs.parse(args);
  const result = await emailOtpService.verifyOTP(email, code);
  return result;
}

// ----- createAppointment -----
const createAppointmentArgs = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  specialty: z.string().optional(),
  otpVerified: z.boolean(),
});

async function createAppointment(args: unknown) {
  const parsed = createAppointmentArgs.parse(args);

  if (!parsed.otpVerified) {
    return {
      success: false,
      error:
        "Email no verificado. Llama primero a requestEmailOTP y luego verifyEmailOTP.",
    };
  }

  const supabase = createAdminClient();

  // Crear cita atómicamente (evita race conditions)
  const { data: bookingResult, error: bookingError } = await supabase.rpc(
    "book_appointment_atomic",
    {
      p_patient_id: parsed.patientId,
      p_doctor_id: parsed.doctorId,
      p_scheduled_date: parsed.scheduledDate,
      p_start_time: parsed.startTime + ":00",
      p_end_time: parsed.endTime + ":00",
      p_priority: "normal",
    }
  );

  if (bookingError) {
    return { success: false, error: bookingError.message };
  }

  if (!bookingResult) {
    return {
      success: false,
      error:
        "Ese horario ya no está disponible (otra persona acaba de reservarlo). Elige otro slot.",
    };
  }

  const appointmentId = bookingResult as string;

  // Cargar datos para email + magic link
  const { data: details } = await supabase
    .from("appointments")
    .select(
      `id, scheduled_date, start_time, end_time,
       patient:patients(id, first_name, last_name, email, auth_user_id),
       doctor:doctors(profile:profiles(first_name, last_name))`
    )
    .eq("id", appointmentId)
    .single();

  let magicLink: string | null = null;

  if (details) {
    const patient = details.patient as unknown as {
      id: string;
      first_name: string;
      last_name: string;
      email: string | null;
      auth_user_id: string | null;
    };
    const doctor = details.doctor as unknown as {
      profile: { first_name: string; last_name: string };
    };

    // Magic link: solo si el paciente es nuevo (sin auth_user_id) y tiene email
    if (patient.email && !patient.auth_user_id) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteUrl) {
        throw new Error("NEXT_PUBLIC_SITE_URL no está configurada");
      }
      const { data: linkData, error: linkError } =
        await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: patient.email,
          options: {
            redirectTo: `${siteUrl}/api/auth/callback?next=/mi-cuenta`,
          },
        });

      if (!linkError && linkData?.properties?.action_link) {
        magicLink = linkData.properties.action_link;

        // Vincular auth_user_id al paciente
        if (linkData.user?.id) {
          await supabase
            .from("patients")
            .update({ auth_user_id: linkData.user.id })
            .eq("id", patient.id);
        }

        // Enviar email separado con magic link
        await sendEmail({
          to: patient.email,
          subject: "Accede a tu portal — Clínica Arca",
          html: magicLinkTemplate({
            patientName: `${patient.first_name} ${patient.last_name}`,
            magicLink,
          }),
        }).catch(() => null);
      }
    }

    // Email de confirmación
    if (patient.email) {
      const [sh, sm] = parsed.startTime.split(":").map(Number);
      const [eh, em] = parsed.endTime.split(":").map(Number);
      const durationMin = eh * 60 + em - (sh * 60 + sm);

      await sendEmail({
        to: patient.email,
        subject: "Confirmación de cita — Clínica Arca",
        html: appointmentConfirmationTemplate({
          patientName: `${patient.first_name} ${patient.last_name}`,
          doctorName: `Dr(a). ${doctor.profile.first_name} ${doctor.profile.last_name}`,
          specialty:
            parsed.specialty && isValidSpecialty(parsed.specialty)
              ? SPECIALTY_LABELS[parsed.specialty]
              : "Consulta dental",
          date: formatDateES(parsed.scheduledDate),
          time: `${parsed.startTime} - ${parsed.endTime}`,
          duration: durationMin,
        }),
      }).catch(() => null);
    }
  }

  return {
    success: true,
    appointmentId,
    patientId: parsed.patientId,
    magicLinkSent: !!magicLink,
  };
}

// ----- cancelAppointment -----
const cancelArgs = z.object({
  appointmentId: z.string().uuid(),
  dni: dniSchema,
});

async function cancelAppointment(args: unknown) {
  const parsed = cancelArgs.parse(args);
  const supabase = createAdminClient();

  // Validar ownership
  const { data: apt } = await supabase
    .from("appointments")
    .select(
      `id, status, scheduled_date, start_time, end_time,
       patient:patients(dni, first_name, last_name, email),
       doctor:doctors(profile:profiles(first_name, last_name))`
    )
    .eq("id", parsed.appointmentId)
    .single();

  if (!apt) return { success: false, error: "Cita no encontrada" };

  const patient = apt.patient as unknown as {
    dni: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };

  if (patient.dni !== parsed.dni) {
    return {
      success: false,
      error: "El DNI no coincide con el paciente de esta cita.",
    };
  }

  if (apt.status === "cancelled" || apt.status === "completed") {
    return {
      success: false,
      error: `La cita ya está ${apt.status}.`,
    };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", parsed.appointmentId);

  if (error) return { success: false, error: error.message };

  // Email de cancelación
  if (patient.email) {
    const doctor = apt.doctor as unknown as {
      profile: { first_name: string; last_name: string };
    };
    await sendEmail({
      to: patient.email,
      subject: "Tu cita ha sido cancelada — Clínica Arca",
      html: appointmentCancelledTemplate({
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `Dr(a). ${doctor.profile.first_name} ${doctor.profile.last_name}`,
        date: formatDateES(apt.scheduled_date as string),
        time: `${(apt.start_time as string).slice(0, 5)} - ${(apt.end_time as string).slice(0, 5)}`,
      }),
    }).catch(() => null);
  }

  return { success: true };
}

// ----- rescheduleAppointment -----
const rescheduleArgs = z.object({
  appointmentId: z.string().uuid(),
  dni: dniSchema,
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  newEndTime: z.string().regex(/^\d{2}:\d{2}$/),
});

async function rescheduleAppointment(args: unknown) {
  const parsed = rescheduleArgs.parse(args);
  const supabase = createAdminClient();

  // Validar ownership y obtener datos viejos
  const { data: apt } = await supabase
    .from("appointments")
    .select(
      `id, doctor_id, status, scheduled_date, start_time, end_time,
       patient:patients(dni, first_name, last_name, email),
       doctor:doctors(profile:profiles(first_name, last_name))`
    )
    .eq("id", parsed.appointmentId)
    .single();

  if (!apt) return { success: false, error: "Cita no encontrada" };

  const patient = apt.patient as unknown as {
    dni: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };

  if (patient.dni !== parsed.dni) {
    return { success: false, error: "El DNI no coincide." };
  }

  if (apt.status !== "confirmed" && apt.status !== "pending") {
    return {
      success: false,
      error: `No se puede reprogramar una cita en estado ${apt.status}.`,
    };
  }

  // Validar nuevo slot
  const { data: isValid } = await supabase.rpc("validate_appointment_slot", {
    p_doctor_id: apt.doctor_id,
    p_date: parsed.newDate,
    p_start: parsed.newStartTime + ":00",
    p_end: parsed.newEndTime + ":00",
  });

  if (!isValid) {
    return {
      success: false,
      error: "El nuevo horario no está disponible. Elige otro slot.",
    };
  }

  const oldDate = apt.scheduled_date as string;
  const oldStart = (apt.start_time as string).slice(0, 5);
  const oldEnd = (apt.end_time as string).slice(0, 5);

  const { error } = await supabase
    .from("appointments")
    .update({
      scheduled_date: parsed.newDate,
      start_time: parsed.newStartTime + ":00",
      end_time: parsed.newEndTime + ":00",
    })
    .eq("id", parsed.appointmentId);

  if (error) return { success: false, error: error.message };

  // Email
  if (patient.email) {
    const doctor = apt.doctor as unknown as {
      profile: { first_name: string; last_name: string };
    };
    await sendEmail({
      to: patient.email,
      subject: "Tu cita ha sido reprogramada — Clínica Arca",
      html: appointmentRescheduledTemplate({
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `Dr(a). ${doctor.profile.first_name} ${doctor.profile.last_name}`,
        oldDate: formatDateES(oldDate),
        oldTime: `${oldStart} - ${oldEnd}`,
        newDate: formatDateES(parsed.newDate),
        newTime: `${parsed.newStartTime} - ${parsed.newEndTime}`,
      }),
    }).catch(() => null);
  }

  return { success: true };
}

// ----- getMyAppointments -----
const getMyArgs = z.object({ dni: dniSchema });

async function getMyAppointments(args: unknown) {
  const { dni } = getMyArgs.parse(args);
  const supabase = createAdminClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .eq("dni", dni)
    .maybeSingle();

  if (!patient) {
    return { found: false, error: "No encontré ningún paciente con ese DNI." };
  }

  const today = todayISO();
  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `id, scheduled_date, start_time, end_time, status,
       doctor:doctors(profile:profiles(first_name, last_name), specialties)`
    )
    .eq("patient_id", patient.id)
    .in("status", ["confirmed", "pending"])
    .gte("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(10);

  const formatted = (appointments ?? []).map((a) => {
    const doctor = a.doctor as unknown as {
      profile: { first_name: string; last_name: string };
      specialties: string[];
    };
    const primarySpecialty = doctor.specialties?.[0] ?? "general";
    return {
      id: a.id,
      date: a.scheduled_date,
      startTime: (a.start_time as string).slice(0, 5),
      endTime: (a.end_time as string).slice(0, 5),
      status: a.status,
      doctorName: `Dr(a). ${doctor.profile.first_name} ${doctor.profile.last_name}`,
      specialty:
        SPECIALTY_LABELS[primarySpecialty as ProcedureCategory] ??
        primarySpecialty,
    };
  });

  return {
    found: true,
    patientName: `${patient.first_name} ${patient.last_name}`,
    appointments: formatted,
  };
}

// ----- getClinicInfo -----
const clinicInfoArgs = z.object({
  topic: z.enum([
    "address",
    "hours",
    "phone",
    "insurance",
    "services",
    "how_to_arrive",
    "parking",
  ]),
});

async function getClinicInfo(args: unknown) {
  const { topic } = clinicInfoArgs.parse(args);
  const supabase = createAdminClient();

  // Cargar settings de BD (best-effort)
  const { data: settings } = await supabase
    .from("clinic_settings")
    .select("key, value");

  const settingsMap = new Map<string, string>(
    (settings ?? []).map((s) => [s.key as string, s.value as string])
  );

  switch (topic) {
    case "address":
      return {
        topic: "Dirección",
        info:
          settingsMap.get("clinic_address") ??
          settingsMap.get("address") ??
          "Av. Huarochirí Mz A14 - Lote 3, Santa Anita, Lima 15011, Perú",
      };
    case "hours":
      return {
        topic: "Horarios de atención",
        info:
          settingsMap.get("hours") ??
          "Lunes a Viernes: 8:00am - 8:00pm. Sábados: 9:00am - 2:00pm. Domingos cerrado.",
      };
    case "phone":
      return {
        topic: "Teléfono",
        info: settingsMap.get("phone") ?? "+51 985 289 689",
      };
    case "insurance":
      return {
        topic: "Seguros aceptados",
        info:
          "Aceptamos los principales seguros dentales: Pacífico, Rímac, Mapfre y La Positiva. Consulta cobertura específica al agendar.",
      };
    case "services":
      return {
        topic: "Servicios",
        info: `Ofrecemos: ${SPECIALTY_VALUES.map((s) => SPECIALTY_LABELS[s]).join(", ")}.`,
      };
    case "how_to_arrive":
      return {
        topic: "Cómo llegar",
        info:
          "Estamos en San Isidro, a 5 minutos del Óvalo Gutiérrez. Hay paraderos del Metropolitano y rutas directas desde Miraflores y San Borja.",
      };
    case "parking":
      return {
        topic: "Estacionamiento",
        info:
          "Contamos con estacionamiento gratuito para pacientes en el sótano del edificio.",
      };
  }
}

// ============================================================================
// EXECUTOR
// ============================================================================

type ToolHandler = (args: unknown, ctx: ToolContext) => Promise<unknown>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  listSpecialties,
  listDoctorsForSpecialty,
  getAvailableSlots,
  createOrFindPatient,
  requestEmailOTP,
  verifyEmailOTP,
  createAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getMyAppointments,
  getClinicInfo,
};

export async function executeToolCall(
  name: string,
  args: unknown,
  ctx: ToolContext
): Promise<unknown> {
  const handler = TOOL_HANDLERS[name];
  if (!handler) {
    return { error: `Tool desconocida: ${name}` };
  }
  try {
    return await handler(args, ctx);
  } catch (err) {
    console.error(`[AI Tool Error] ${name}:`, err);
    return {
      error:
        err instanceof Error ? err.message : "Error interno ejecutando la tool",
    };
  }
}
