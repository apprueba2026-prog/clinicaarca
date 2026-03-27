import { createClient } from "@/lib/supabase/client";
import type { Appointment } from "@/lib/types/appointment";

const APPOINTMENT_COLUMNS =
  "id, patient_id, doctor_id, procedure_id, scheduled_date, start_time, end_time, status, priority, notes, room, created_by, created_at, updated_at";

export const appointmentsService = {
  async getByDateRange(
    startDate: string,
    endDate: string,
    doctorId?: string | null
  ): Promise<Appointment[]> {
    const supabase = createClient();
    let query = supabase
      .from("appointments")
      .select(APPOINTMENT_COLUMNS)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("start_time", { ascending: true });

    if (doctorId) {
      query = query.eq("doctor_id", doctorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as Appointment[]) ?? [];
  },

  async getToday(): Promise<Appointment[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.getByDateRange(today, today);
  },

  async create(
    appointment: Omit<Appointment, "id" | "created_at" | "updated_at">
  ): Promise<Appointment> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("appointments")
      .insert(appointment)
      .select(APPOINTMENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as Appointment;
  },

  async updateStatus(
    id: string,
    status: Appointment["status"]
  ): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
  },
};
