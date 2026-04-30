/**
 * GET/PATCH /api/profile/me — perfil propio del usuario logueado.
 *
 * GET: devuelve el profile completo.
 * PATCH: actualiza first_name, last_name, phone, avatar_url.
 *        Para cambiar email/password se usa supabase.auth.updateUser
 *        directamente desde el cliente (requiere flujo de verificación).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_COLUMNS =
  "id, role, is_active, first_name, last_name, email, phone, avatar_url, created_at, updated_at";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

const patchSchema = z.object({
  first_name: z.string().min(1).max(80).optional(),
  last_name: z.string().min(1).max(80).optional(),
  phone: z
    .string()
    .max(40)
    .nullable()
    .optional(),
  avatar_url: z.string().url().nullable().optional(),
});

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

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

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("[profile/me PATCH]", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el perfil" },
      { status: 500 }
    );
  }

  // Sync user_metadata si se cambió el nombre. El TopBar (admin-top-bar.tsx)
  // ya prefiere profile.first_name pero hay otros lugares en el código (legacy)
  // que aún leen user_metadata.full_name. Mantenerlos sincronizados.
  if (updates.first_name !== undefined || updates.last_name !== undefined) {
    const first = updates.first_name ?? data.first_name ?? "";
    const last = updates.last_name ?? data.last_name ?? "";
    const adminClient = createAdminClient();
    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          first_name: first,
          last_name: last,
          full_name: `${first} ${last}`.trim(),
        },
      }
    );
    if (metaError) {
      console.error("[profile/me PATCH] sync metadata failed:", metaError);
    }
  }

  return NextResponse.json({ profile: data });
}
