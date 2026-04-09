import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/email/send-email";
import { appointmentReminderTemplate } from "@/lib/email/templates/appointment-reminder";

const specialtyLabels: Record<string, string> = {
  general: "Odontología General",
  implantes: "Implantes Dentales",
  odontopediatria: "Odontopediatría",
  ortodoncia: "Ortodoncia",
  sedacion: "Sedación Dental",
  cirugia: "Cirugía Oral",
  estetica: "Estética Dental",
  endodoncia: "Endodoncia",
  periodoncia: "Periodoncia",
};

function formatDateES(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * GET /api/cron/send-reminders
 *
 * Envía recordatorios por email a pacientes con citas para mañana.
 * Protegido con CRON_SECRET. Diseñado para ser llamado por:
 * - Vercel Cron Jobs (vercel.json)
 * - pg_cron (via http extension)
 * - Cron externo (cron-job.org, etc.)
 *
 * Se ejecuta diariamente a las 8:00 AM PET (13:00 UTC).
 */
export async function GET(request: Request) {
  try {
    // Verificar secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Usar service role para leer todas las citas (sin RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Configuración de Supabase incompleta" },
        { status: 500 }
      );
    }

    const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    });

    // Calcular fecha de mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Obtener citas de mañana con status confirmado
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `id, scheduled_date, start_time, end_time,
        patient:patients(first_name, last_name, email),
        doctor:doctors(
          specialties,
          profile:profiles(first_name, last_name)
        )`
      )
      .eq("scheduled_date", tomorrowStr)
      .eq("status", "confirmed");

    if (error) {
      console.error("[CRON] Error fetching appointments:", error);
      return NextResponse.json(
        { error: "Error consultando citas" },
        { status: 500 }
      );
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        message: "No hay citas para mañana",
        sent: 0,
      });
    }

    let sent = 0;
    let failed = 0;

    for (const apt of appointments) {
      const patient = apt.patient as unknown as {
        first_name: string;
        last_name: string;
        email: string | null;
      };
      const doctor = apt.doctor as unknown as {
        specialties: string[];
        profile: { first_name: string; last_name: string };
      };

      if (!patient?.email) continue;

      const primarySpecialty = doctor.specialties?.[0] ?? "general";

      const html = appointmentReminderTemplate({
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `Dr(a). ${doctor.profile.first_name} ${doctor.profile.last_name}`,
        specialty: specialtyLabels[primarySpecialty] ?? primarySpecialty,
        date: formatDateES(apt.scheduled_date),
        time: `${apt.start_time.slice(0, 5)} - ${apt.end_time.slice(0, 5)}`,
      });

      const result = await sendEmail({
        to: patient.email,
        subject: `Recordatorio: tu cita es mañana — ${apt.start_time.slice(0, 5)}`,
        html,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return NextResponse.json({
      message: `Recordatorios procesados`,
      total: appointments.length,
      sent,
      failed,
    });
  } catch (err) {
    console.error("[CRON] Error:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
