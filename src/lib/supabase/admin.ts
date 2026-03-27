import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role para operaciones de servidor que
 * necesitan bypass de RLS. NUNCA usar en el cliente.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";
  return createClient(url, key);
}
