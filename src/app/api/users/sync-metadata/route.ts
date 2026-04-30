/**
 * POST /api/users/sync-metadata  (admin only)
 *
 * Sincroniza auth.users.user_metadata con profiles para TODOS los usuarios.
 *
 * Bug histórico detectado en v1.1 (2026-04-30):
 * Cuando se cambiaba el rol desde /usuarios, solo se actualizaba profiles.role
 * pero NO auth.users.user_metadata.role. El callback de login y el middleware
 * leen user_metadata, así que el cambio no tomaba efecto.
 *
 * Este endpoint hace un sweep masivo: por cada profile, copia
 * (role, first_name, last_name, full_name) a user_metadata.
 *
 * Se ejecuta UNA VEZ tras el deploy del fix. Idempotente — se puede correr
 * múltiples veces sin efectos adversos.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const { data: actor } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (!actor || !actor.is_active || actor.role !== "admin") {
      return NextResponse.json({ error: "Solo admin" }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, role, first_name, last_name");

    if (profilesError || !profiles) {
      return NextResponse.json(
        { error: profilesError?.message ?? "No se pudo leer profiles" },
        { status: 500 }
      );
    }

    let synced = 0;
    let failed = 0;
    const failures: Array<{ id: string; reason: string }> = [];

    for (const p of profiles) {
      const first = (p.first_name as string) ?? "";
      const last = (p.last_name as string) ?? "";
      const { error } = await admin.auth.admin.updateUserById(
        p.id as string,
        {
          user_metadata: {
            role: p.role,
            first_name: first,
            last_name: last,
            full_name: `${first} ${last}`.trim(),
          },
        }
      );
      if (error) {
        failed++;
        failures.push({ id: p.id as string, reason: error.message });
      } else {
        synced++;
      }
    }

    return NextResponse.json({
      total: profiles.length,
      synced,
      failed,
      ...(failures.length > 0 && { failures }),
    });
  } catch (err) {
    console.error("[users/sync-metadata]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
