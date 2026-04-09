import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role para operaciones de servidor que
 * necesitan bypass de RLS. NUNCA usar en el cliente.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno Supabase: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key);
}
