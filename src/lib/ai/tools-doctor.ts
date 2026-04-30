import "server-only";
import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tools de "Noé Doctor" — uso interno del doctor especialista vía Telegram.
 *
 * Diseño v1.2:
 *  - SOLO lectura. No reprograma ni cancela (acciones críticas → panel admin).
 *  - El doctorId viene del contexto (chat vinculado), no del modelo.
 *    Esto previene fishing entre doctores: el modelo solo puede consultar
 *    SU agenda y SUS pacientes, sin importar lo que pida el usuario.
 *  - Acceso TOTAL a sus pacientes (decisión usuario): cualquier paciente con
 *    historia con este doctor (no solo próximos).
 */

// ============================================================================
// CONTEXTO
// ============================================================================

export interface DoctorToolContext {
  /** doctor_id del Telegram vinculado — fija el scope de TODAS las queries. */
  doctorId: string;
}

// ============================================================================
// DECLARATIONS
// ============================================================================

export const DOCTOR_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "getMyAgendaForDate",
    description:
      "Devuelve la agenda del doctor para una fecha específica (default: hoy). Incluye citas confirmadas y pendientes con paciente, hora, motivo. Si no se pasa fecha, usa hoy en zona Lima.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: {
          type: SchemaType.STRING,
          description: "Fecha YYYY-MM-DD. Si se omite, usa hoy.",
        },
      },
    },
  },
  {
    name: "countMyAppointments",
    description:
      "Cuenta citas próximas del doctor en una ventana. Modos:\n- mode='today': citas de hoy\n- mode='week': citas de los próximos 7 días (incluye hoy)\n- mode='range': entre dateFrom y dateTo (inclusivo)\nÚtil para preguntas como 'cuántas citas tengo hoy' o 'esta semana'.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        mode: {
          type: SchemaType.STRING,
          description: "today | week | range",
        },
        dateFrom: {
          type: SchemaType.STRING,
          description: "YYYY-MM-DD (solo si mode='range').",
        },
        dateTo: {
          type: SchemaType.STRING,
          description: "YYYY-MM-DD (solo si mode='range').",
        },
      },
      required: ["mode"],
    },
  },
  {
    name: "searchMyPatient",
    description:
      "Busca pacientes que el doctor ha atendido (por DNI, nombre o apellido). Devuelve hasta 5 coincidencias.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description:
            "DNI (8 dígitos), nombre o apellido. Ejemplo: '12345678', 'Diógenes', 'Arca'.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "getMyPatientDetails",
    description:
      "Devuelve datos completos de UN paciente específico del doctor + historial reciente de citas (últimas 10). Llamar primero searchMyPatient si solo tienes nombre, después esta tool con el _id que regresó.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        patientId: {
          type: SchemaType.STRING,
          description: "UUID del paciente (campo _id de searchMyPatient).",
        },
      },
      required: ["patientId"],
    },
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function todayLimaISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
  }).format(new Date());
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split("T")[0];
}

const dayNames = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function dayNameOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return dayNames[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

// ============================================================================
// HANDLERS
// ============================================================================

const dateArg = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

async function getMyAgendaForDate(args: unknown, ctx: DoctorToolContext) {
  const { date } = dateArg.parse(args);
  const target = date ?? todayLimaISO();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `id, start_time, end_time, status,
       patient:patients(first_name, last_name, dni, phone),
       procedure:procedures(name)`
    )
    .eq("doctor_id", ctx.doctorId)
    .eq("scheduled_date", target)
    .not("status", "in", "(cancelled,no_show)")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[doctor:getMyAgendaForDate]", error);
    return { retry: true };
  }

  const appointments = (data ?? []).map((a) => {
    const p = a.patient as unknown as {
      first_name: string;
      last_name: string;
    } | null;
    const proc = a.procedure as unknown as { name: string } | null;
    return {
      time: `${(a.start_time as string).slice(0, 5)}-${(a.end_time as string).slice(0, 5)}`,
      patient: p ? `${p.first_name} ${p.last_name}` : "—",
      procedure: proc?.name ?? "Consulta",
      status: a.status,
    };
  });

  return {
    date: target,
    dayOfWeek: dayNameOf(target),
    total: appointments.length,
    appointments,
  };
}

const countArgs = z.object({
  mode: z.enum(["today", "week", "range"]),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

async function countMyAppointments(args: unknown, ctx: DoctorToolContext) {
  const parsed = countArgs.parse(args);
  const supabase = createAdminClient();

  let from: string;
  let to: string;
  if (parsed.mode === "today") {
    from = todayLimaISO();
    to = from;
  } else if (parsed.mode === "week") {
    from = todayLimaISO();
    to = addDays(from, 6);
  } else {
    if (!parsed.dateFrom || !parsed.dateTo) {
      return { retry: true, hint: "mode=range requiere dateFrom y dateTo" };
    }
    from = parsed.dateFrom;
    to = parsed.dateTo;
  }

  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("doctor_id", ctx.doctorId)
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .not("status", "in", "(cancelled,no_show)");

  return {
    mode: parsed.mode,
    dateFrom: from,
    dateTo: to,
    count: count ?? 0,
  };
}

const searchArgs = z.object({ query: z.string().min(2) });

async function searchMyPatient(args: unknown, ctx: DoctorToolContext) {
  const { query } = searchArgs.parse(args);
  const supabase = createAdminClient();

  // Pacientes que han tenido citas con ESTE doctor.
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `patient:patients!inner(id, first_name, last_name, dni, phone)`
    )
    .eq("doctor_id", ctx.doctorId)
    .or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,dni.ilike.%${query}%`,
      { foreignTable: "patient" }
    )
    .limit(15);

  if (error) {
    console.error("[doctor:searchMyPatient]", error);
    return { retry: true };
  }

  // Dedup por patient.id
  const seen = new Set<string>();
  const patients: Array<{
    _id: string;
    name: string;
    dni: string;
    phone: string | null;
  }> = [];
  for (const row of data ?? []) {
    const p = row.patient as unknown as {
      id: string;
      first_name: string;
      last_name: string;
      dni: string;
      phone: string | null;
    } | null;
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    patients.push({
      _id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      dni: p.dni,
      phone: p.phone,
    });
    if (patients.length >= 5) break;
  }

  return { found: patients.length, patients };
}

const detailsArgs = z.object({ patientId: z.string().uuid() });

async function getMyPatientDetails(args: unknown, ctx: DoctorToolContext) {
  const { patientId } = detailsArgs.parse(args);
  const supabase = createAdminClient();

  // Verificar que el paciente sí ha tenido citas con este doctor (defensa).
  const { count: relationCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("doctor_id", ctx.doctorId)
    .eq("patient_id", patientId);
  if (!relationCount || relationCount === 0) {
    return { retry: true, hint: "Paciente sin historia con este doctor." };
  }

  const { data: patient } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, dni, phone, email, birth_date, address, notes"
    )
    .eq("id", patientId)
    .maybeSingle();

  if (!patient) return { retry: true };

  // Últimas 10 citas con este doctor
  const { data: appts } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_date, start_time, end_time, status, notes, procedure:procedures(name)"
    )
    .eq("doctor_id", ctx.doctorId)
    .eq("patient_id", patientId)
    .order("scheduled_date", { ascending: false })
    .limit(10);

  return {
    patient: {
      name: `${patient.first_name} ${patient.last_name}`,
      dni: patient.dni,
      phone: patient.phone,
      email: patient.email,
      birthDate: patient.birth_date,
      address: patient.address,
      notes: patient.notes,
    },
    recentAppointments: (appts ?? []).map((a) => {
      const p = a.procedure as unknown as { name: string } | null;
      return {
        date: a.scheduled_date,
        time: `${(a.start_time as string).slice(0, 5)}-${(a.end_time as string).slice(0, 5)}`,
        status: a.status,
        procedure: p?.name ?? "Consulta",
        notes: a.notes,
      };
    }),
  };
}

// ============================================================================
// EXECUTOR
// ============================================================================

type DoctorToolHandler = (
  args: unknown,
  ctx: DoctorToolContext
) => Promise<unknown>;

const HANDLERS: Record<string, DoctorToolHandler> = {
  getMyAgendaForDate,
  countMyAppointments,
  searchMyPatient,
  getMyPatientDetails,
};

export async function executeDoctorToolCall(
  name: string,
  args: unknown,
  ctx: DoctorToolContext
): Promise<unknown> {
  const handler = HANDLERS[name];
  if (!handler) return { retry: true };
  try {
    return await handler(args, ctx);
  } catch (err) {
    console.error(`[doctor tool ${name}]`, err);
    return { retry: true };
  }
}
