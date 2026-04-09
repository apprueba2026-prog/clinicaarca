import { createClient } from "@/lib/supabase/client";
import type { AppointmentWithDetails } from "@/lib/types/appointment";

const TODAY_APPOINTMENTS_QUERY = `
  id,
  scheduled_date,
  start_time,
  end_time,
  status,
  priority,
  notes,
  room,
  patient:patients(first_name, last_name, dni, phone),
  doctor:doctors(
    specialties,
    profile:profiles(first_name, last_name)
  ),
  procedure:procedures(name, category)
`;

export const dashboardService = {
  async getTodayAppointments(): Promise<AppointmentWithDetails[]> {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("appointments")
      .select(TODAY_APPOINTMENTS_QUERY)
      .eq("scheduled_date", today)
      .order("start_time", { ascending: true });

    if (error) throw error;
    return (data as unknown as AppointmentWithDetails[]) ?? [];
  },

  async getTodayAppointmentCount(): Promise<number> {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    const { count, error } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("scheduled_date", today);

    if (error) throw error;
    return count ?? 0;
  },

  async getNewPatientsThisMonth(): Promise<number> {
    const supabase = createClient();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const { count, error } = await supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .gte("created_at", firstDay);

    if (error) throw error;
    return count ?? 0;
  },

  async getEstimatedRevenue(): Promise<number> {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("appointments")
      .select("procedure:procedures(base_price)")
      .eq("scheduled_date", today)
      .in("status", ["pending", "confirmed", "in_progress", "completed"]);

    if (error) throw error;

    return (data ?? []).reduce((sum, row) => {
      const price = (row.procedure as unknown as { base_price: number })
        ?.base_price ?? 0;
      return sum + price;
    }, 0);
  },
};
