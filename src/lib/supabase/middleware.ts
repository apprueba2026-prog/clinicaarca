import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rutas protegidas del admin
  const isAdminRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/agenda") ||
    pathname.startsWith("/pacientes") ||
    pathname.startsWith("/doctores") ||
    pathname.startsWith("/contenidos") ||
    pathname.startsWith("/facturacion") ||
    pathname.startsWith("/configuracion");

  // Rutas protegidas del paciente
  const isPatientRoute = pathname.startsWith("/mi-cuenta");

  // Rutas de auth (login, registro, recuperar contraseña)
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/registro" ||
    pathname === "/recuperar-contrasena";

  // Proteger rutas admin: requieren sesión
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Proteger rutas admin: pacientes no pueden acceder
  if (isAdminRoute && user) {
    const role = user.user_metadata?.role as string;
    if (role === "patient") {
      const url = request.nextUrl.clone();
      url.pathname = "/mi-cuenta";
      return NextResponse.redirect(url);
    }
  }

  // Proteger rutas paciente: requieren sesión
  if (isPatientRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Si está logueado y va a rutas de auth, redirigir según rol
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const role = user.user_metadata?.role as string;
    url.pathname = role === "patient" ? "/mi-cuenta" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
