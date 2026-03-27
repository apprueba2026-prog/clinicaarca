import type { ContentStatus } from "./enums";

export interface Testimonial {
  id: string;
  patient_name: string;
  review_text: string | null;
  rating: number;
  video_url: string | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  is_visible: boolean;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}
