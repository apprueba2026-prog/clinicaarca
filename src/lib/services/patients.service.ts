import { createClient } from "@/lib/supabase/client";
import type { Patient } from "@/lib/types/patient";

const PATIENT_COLUMNS =
  "id, dni, first_name, last_name, email, phone, birth_date, address, insurance_partner_id, insurance_policy_number, status, notes, avatar_url, is_premium, created_at, updated_at";

export const patientsService = {
  async getAll(page = 0, limit = 20): Promise<Patient[]> {
    const supabase = createClient();
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("patients")
      .select(PATIENT_COLUMNS)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    return (data as Patient[]) ?? [];
  },

  async getById(id: string): Promise<Patient | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("patients")
      .select(PATIENT_COLUMNS)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Patient | null;
  },

  async search(query: string): Promise<Patient[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("patients")
      .select(PATIENT_COLUMNS)
      .or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,dni.ilike.%${query}%,phone.ilike.%${query}%`
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data as Patient[]) ?? [];
  },

  async create(
    patient: Omit<Patient, "id" | "created_at" | "updated_at">
  ): Promise<Patient> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("patients")
      .insert(patient)
      .select(PATIENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as Patient;
  },

  async getCount(): Promise<number> {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("patients")
      .select("id", { count: "exact", head: true });

    if (error) throw error;
    return count ?? 0;
  },
};
