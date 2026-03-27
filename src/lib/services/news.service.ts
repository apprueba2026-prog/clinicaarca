import { createClient } from "@/lib/supabase/client";
import type { ContentStatus, NewsCategory } from "@/lib/types/enums";

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_image_url: string | null;
  category: NewsCategory;
  status: ContentStatus;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

const NEWS_COLUMNS =
  "id, title, slug, excerpt, body, cover_image_url, category, status, published_at, author_id, created_at, updated_at";

export const newsService = {
  async getAll(): Promise<NewsArticle[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("news")
      .select(NEWS_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as NewsArticle[]) ?? [];
  },

  async create(
    article: Pick<NewsArticle, "title" | "slug" | "excerpt" | "body" | "cover_image_url" | "category" | "author_id">
  ): Promise<NewsArticle> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("news")
      .insert({
        ...article,
        status: "draft",
      })
      .select(NEWS_COLUMNS)
      .single();

    if (error) throw error;
    return data as NewsArticle;
  },

  async updateStatus(id: string, status: ContentStatus): Promise<void> {
    const supabase = createClient();
    const updates: Record<string, unknown> = { status };
    if (status === "published") {
      updates.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("news")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("news").delete().eq("id", id);

    if (error) throw error;
  },
};
