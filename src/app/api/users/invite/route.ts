/**
 * POST /api/users/invite
 *
 * Admin invita un nuevo miembro del staff. Crea (si no existe) un usuario
 * en auth.users y un row en profiles con el rol asignado. Envía un magic
 * link al email para que la persona acceda y configure su contraseña.
 *
 * Body: { email, role, first_name, last_name }
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "dentist", "receptionist"]),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
});

export async function POST(req: Request) {
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

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, role, first_name, last_name } = parsed.data;

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL no configurado" },
      { status: 500 }
    );
  }

  // Genera link de invitación + crea auth.users si no existe.
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: `${siteUrl}/api/auth/callback?next=/dashboard`,
        data: { role, first_name, last_name },
      },
    });

  if (linkError || !linkData?.user?.id) {
    console.error("[users/invite]", linkError);
    return NextResponse.json(
      { error: linkError?.message ?? "No se pudo crear la invitación" },
      { status: 500 }
    );
  }

  const newUserId = linkData.user.id;

  // Upsert profile con el rol asignado.
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: newUserId,
      role,
      is_active: true,
      first_name,
      last_name,
      email,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("[users/invite] profile upsert", profileError);
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    invited: true,
    email,
    inviteLink: linkData.properties?.action_link ?? null,
  });
}
