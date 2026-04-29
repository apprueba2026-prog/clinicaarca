import { createClient } from "@/lib/supabase/client";
import type { Testimonial } from "@/lib/types/testimonial";

export const TESTIMONIAL_COLUMNS =
  "id, patient_name, review_text, rating, video_url, thumbnail_url, is_featured, is_visible, status, created_at, updated_at";

export const PUBLIC_CAROUSEL_LIMIT = 7;

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
    testimonial: Pick<
      Testimonial,
      "patient_name" | "review_text" | "rating" | "video_url" | "thumbnail_url"
    >
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

    const { data: row, error: fetchErr } = await supabase
      .from("testimonials")
      .select("video_url, thumbnail_url")
      .eq("id", id)
      .single();
    if (fetchErr) throw fetchErr;

    const paths = [row?.video_url, row?.thumbnail_url]
      .map((url) => (url ? extractStoragePath(url) : null))
      .filter((p): p is string => !!p);

    if (paths.length > 0) {
      await supabase.storage.from("testimonial-videos").remove(paths);
    }

    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Si hay >= PUBLIC_CAROUSEL_LIMIT publicados visibles, elimina los más antiguos
   * hasta dejar espacio para 1 nuevo. Borra también sus archivos del bucket.
   */
  async pruneOldestIfFull(): Promise<void> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("id, video_url, thumbnail_url")
      .eq("is_visible", true)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const list = data ?? [];
    if (list.length < PUBLIC_CAROUSEL_LIMIT) return;

    const toRemove = list.slice(PUBLIC_CAROUSEL_LIMIT - 1);
    for (const row of toRemove) {
      const paths = [row.video_url, row.thumbnail_url]
        .map((url) => (url ? extractStoragePath(url) : null))
        .filter((p): p is string => !!p);
      if (paths.length > 0) {
        await supabase.storage.from("testimonial-videos").remove(paths);
      }
      await supabase.from("testimonials").delete().eq("id", row.id);
    }
  },

  async uploadVideo(file: File): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "mp4";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("testimonial-videos")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage
      .from("testimonial-videos")
      .getPublicUrl(path);

    return data.publicUrl;
  },

  async uploadThumbnail(blob: Blob): Promise<string> {
    const supabase = createClient();
    const path = `${crypto.randomUUID()}-thumb.jpg`;

    const { error } = await supabase.storage
      .from("testimonial-videos")
      .upload(path, blob, { contentType: "image/jpeg", upsert: false });

    if (error) throw error;

    const { data } = supabase.storage
      .from("testimonial-videos")
      .getPublicUrl(path);

    return data.publicUrl;
  },
};

/**
 * Extrae la ruta dentro del bucket a partir de una public URL de Supabase Storage.
 * Ej: https://xxx.supabase.co/storage/v1/object/public/testimonial-videos/abc.mp4 → "abc.mp4"
 */
function extractStoragePath(publicUrl: string): string | null {
  const marker = "/testimonial-videos/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
