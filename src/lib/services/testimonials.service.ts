import { createClient } from "@/lib/supabase/client";
import type { Testimonial } from "@/lib/types/testimonial";

const TESTIMONIAL_COLUMNS =
  "id, patient_name, review_text, rating, video_url, thumbnail_url, is_featured, is_visible, status, created_at, updated_at";

export const testimonialsService = {
  async getAll(): Promise<Testimonial[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select(TESTIMONIAL_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Testimonial[]) ?? [];
  },

  async create(
    testimonial: Pick<Testimonial, "patient_name" | "review_text" | "rating" | "video_url" | "thumbnail_url">
  ): Promise<Testimonial> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        ...testimonial,
        is_featured: false,
        is_visible: true,
        status: "published",
      })
      .select(TESTIMONIAL_COLUMNS)
      .single();

    if (error) throw error;
    return data as Testimonial;
  },

  async toggleVisibility(id: string, isVisible: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("testimonials")
      .update({ is_visible: isVisible })
      .eq("id", id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async uploadVideo(file: File): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("testimonial-videos")
      .upload(path, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("testimonial-videos")
      .getPublicUrl(path);

    return data.publicUrl;
  },
};
