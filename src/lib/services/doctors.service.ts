import { createClient } from "@/lib/supabase/client";

interface DoctorOption {
  id: string;
  profile: {
    first_name: string;
    last_name: string;
  };
  specialties: string | null;
}

export const doctorsService = {
  async getAll(): Promise<DoctorOption[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("doctors")
      .select("id, specialties, profile:profiles(first_name, last_name)")
      .eq("is_public", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data as unknown as DoctorOption[]) ?? [];
  },
};
