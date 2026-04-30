/**
 * PATCH /api/users/[id] — admin cambia rol, nombre o is_active.
 * No permite cambiar el propio rol (defensa anti-lockout: si el único
 * admin se baja a recepcionista, nadie puede recuperar permisos).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_COLUMNS =
  "id, role, is_active, first_name, last_name, email, phone, avatar_url, created_at, updated_at";

const patchSchema = z.object({
  role: z.enum(["admin", "dentist", "receptionist", "patient"]).optional(),
  is_active: z.boolean().optional(),
  first_name: z.string().min(1).max(80).optional(),
  last_name: z.string().min(1).max(80).optional(),
  phone: z.string().max(40).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Sin campos para actualizar" },
      { status: 400 }
    );
  }

  // Defensa anti-lockout: el admin no puede cambiarse a sí mismo de rol.
  if (id === user.id && updates.role && updates.role !== "admin") {
    return NextResponse.json(
      {
        error:
          "No puedes cambiar tu propio rol. Pide a otro admin que lo haga.",
      },
      { status: 400 }
    );
  }
  if (id === user.id && updates.is_active === false) {
    return NextResponse.json(
      { error: "No puedes desactivar tu propia cuenta." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("[users PATCH]", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el usuario" },
      { status: 500 }
    );
  }

  // CRÍTICO: sincronizar auth.users.user_metadata con los cambios.
  // El callback de login y el middleware de Supabase leen user_metadata.role
  // (no profiles.role), así que sin este sync el cambio no toma efecto y el
  // usuario sigue cayendo al dashboard del rol viejo.
  // Bug detectado en v1.1 con Aldrick (paciente→dentista) y Dina (paciente→
  // recepcionista) que seguían viendo /mi-cuenta tras el cambio.
  const metadataPatch: Record<string, unknown> = {};
  if (updates.role !== undefined) metadataPatch.role = updates.role;
  if (updates.first_name !== undefined || updates.last_name !== undefined) {
    const first = updates.first_name ?? data.first_name ?? "";
    const last = updates.last_name ?? data.last_name ?? "";
    metadataPatch.first_name = first;
    metadataPatch.last_name = last;
    metadataPatch.full_name = `${first} ${last}`.trim();
  }
  if (Object.keys(metadataPatch).length > 0) {
    const adminClient = createAdminClient();
    const { error: metaError } =
      await adminClient.auth.admin.updateUserById(id, {
        user_metadata: metadataPatch,
      });
    if (metaError) {
      console.error("[users PATCH] sync user_metadata failed:", metaError);
      // No rompemos: profiles ya quedó actualizado. Solo log.
    }
  }

  return NextResponse.json({ user: data });
}
