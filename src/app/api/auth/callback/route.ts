import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const restore = searchParams.get("restore");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Si hay un "next" explícito (ej: /agendar-cita, /cambiar-contrasena)
      if (next) {
        const redirectUrl = restore
          ? `${origin}${next}?restore=${restore}`
          : `${origin}${next}`;
        return NextResponse.redirect(redirectUrl);
      }
      // Determinar redirección por rol
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role as string;
      const redirect = role === "patient" ? "/mi-cuenta" : "/dashboard";
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
