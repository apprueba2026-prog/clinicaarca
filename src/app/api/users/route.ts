/**
 * GET /api/users — lista todos los profiles staff.
 * POST /api/users/invite — (en /invite/route.ts).
 *
 * Solo admin. Filtros: ?role=admin|dentist|receptionist|patient, ?active=true.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_COLUMNS =
  "id, role, is_active, first_name, last_name, email, phone, avatar_url, created_at, updated_at";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado", status: 401 as const };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.is_active || profile.role !== "admin") {
    return { error: "Solo admin", status: 403 as const };
  }
  return { supabase };
}

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const { supabase } = guard;

  const url = new URL(req.url);
  const roleFilter = url.searchParams.get("role");
  const activeFilter = url.searchParams.get("active");

  let query = supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);

  if (roleFilter) query = query.eq("role", roleFilter);
  if (activeFilter !== null) {
    query = query.eq("is_active", activeFilter === "true");
  }

  const { data, error } = await query;
  if (error) {
    console.error("[users GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ users: data ?? [] });
}
