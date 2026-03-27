import { createClient } from "@/lib/supabase/client";

interface ProcedureOption {
  id: string;
  name: string;
  category: string;
  base_price: number;
  estimated_duration_minutes: number;
}

export const proceduresService = {
  async getActive(): Promise<ProcedureOption[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("procedures")
      .select("id, name, category, base_price, estimated_duration_minutes")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data as ProcedureOption[]) ?? [];
  },
};
