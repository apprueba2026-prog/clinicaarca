import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Testimonial } from "@/lib/types/testimonial";
import {
  PUBLIC_CAROUSEL_LIMIT,
  TESTIMONIAL_COLUMNS,
} from "./testimonials.service";

/**
 * Server-side fetch para Server Components.
 * Solo registros visibles + publicados, ordenados por destacados y luego recientes.
 */
export async function getPublicTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select(TESTIMONIAL_COLUMNS)
    .eq("is_visible", true)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(0, PUBLIC_CAROUSEL_LIMIT - 1);

  if (error) {
    console.error("[testimonials] getPublicTestimonials error", error);
    return [];
  }
  return (data as Testimonial[]) ?? [];
}
