import { createClient } from "@/lib/supabase/client";

export interface StaffProfile {
  id: string;
  doctor_id: string;
  display_name: string;
  specialty_label: string;
  bio: string | null;
  photo_url: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
}

export interface DoctorWithStaffInfo {
  id: string;
  specialties: string[];
  is_public: boolean;
  profile: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export const staffService = {
  async getAll(): Promise<DoctorWithStaffInfo[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("doctors")
      .select(
        "id, specialties, is_public, profile:profiles(first_name, last_name, avatar_url)"
      )
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data as unknown as DoctorWithStaffInfo[]) ?? [];
  },

  async togglePublic(doctorId: string, isPublic: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("doctors")
      .update({ is_public: isPublic })
      .eq("id", doctorId);

    if (error) throw error;
  },
};
