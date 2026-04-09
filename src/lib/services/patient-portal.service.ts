import { createClient } from "@/lib/supabase/client";
import type { Patient } from "@/lib/types/patient";

const PATIENT_COLUMNS =
  "id, auth_user_id, dni, first_name, last_name, email, phone, birth_date, address, insurance_partner_id, insurance_policy_number, status, notes, avatar_url, is_premium, created_at, updated_at";

const APPOINTMENT_WITH_DETAILS =
  `id, patient_id, doctor_id, procedure_id, scheduled_date, start_time, end_time, status, priority, notes, created_at,
  doctor:doctors(
    specialties,
    profile:profiles(first_name, last_name, avatar_url)
  ),
  procedure:procedures(name, category)`;

export interface PatientAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  procedure_id: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  priority: string;
  notes: string | null;
  created_at: string;
  doctor: {
    specialties: string[];
    profile: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  };
  procedure: {
    name: string;
    category: string;
  } | null;
}

export const patientPortalService = {
  /** Obtener perfil del paciente autenticado */
  async getMyProfile(): Promise<Patient | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("patients")
      .select(PATIENT_COLUMNS)
      .eq("auth_user_id", user.id)
      .single();

    if (error) throw error;
    return data as Patient;
  },

  /** Obtener próximas citas del paciente autenticado */
  async getMyUpcomingAppointments(): Promise<PatientAppointment[]> {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("appointments")
      .select(APPOINTMENT_WITH_DETAILS)
      .gte("scheduled_date", today)
      .in("status", ["pending", "confirmed"])
      .order("scheduled_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;
    return (data as unknown as PatientAppointment[]) ?? [];
  },

  /** Obtener historial de citas pasadas del paciente */
  async getMyPastAppointments(
    page = 0,
    limit = 10
  ): Promise<PatientAppointment[]> {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("appointments")
      .select(APPOINTMENT_WITH_DETAILS)
      .or(`scheduled_date.lt.${today},status.in.(completed,cancelled,no_show)`)
      .order("scheduled_date", { ascending: false })
      .order("start_time", { ascending: false })
      .range(from, to);

    if (error) throw error;
    return (data as unknown as PatientAppointment[]) ?? [];
  },

  /** Actualizar datos personales del paciente */
  async updateMyProfile(
    data: Partial<
      Pick<Patient, "first_name" | "last_name" | "phone" | "birth_date" | "address">
    >
  ): Promise<Patient> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("No autenticado");

    const { data: updated, error } = await supabase
      .from("patients")
      .update(data)
      .eq("auth_user_id", user.id)
      .select(PATIENT_COLUMNS)
      .single();

    if (error) throw error;
    return updated as Patient;
  },

  /** Cancelar una cita propia */
  async cancelMyAppointment(appointmentId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (error) throw error;
  },
};
