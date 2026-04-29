import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { RESTRICTED_ROUTES, type StaffRole } from "@/lib/utils/constants";

/**
 * Middleware del modelo de roles v1.1.
 *
 * Reglas:
 *  - Si la ruta es admin (/dashboard, /agenda, /pacientes, /doctores, etc.)
 *    requiere sesión activa. Sin sesión → /login.
 *  - Algunas rutas son SOLO para rol 'admin' (ver RESTRICTED_ROUTES en
 *    lib/utils/constants.ts: /doctores, /contenidos, /facturacion,
 *    /usuarios, /configuracion). Otros roles → /dashboard.
 *
 * El profile.role se lee desde Supabase con un cliente SSR ligero. La
 * cookie de sesión va automáticamente con la request del browser.
 */

const ADMIN_PATH_PREFIXES = [
  "/dashboard",
  "/agenda",
  "/pacientes",
  "/doctores",
  "/contenidos",
  "/facturacion",
  "/usuarios",
  "/configuracion",
  "/perfil",
];

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function findRestrictedRoute(pathname: string) {
  return RESTRICTED_ROUTES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isAdminPath(pathname)) return NextResponse.next();

  const res = NextResponse.next();

  // Cliente SSR — lee cookies del browser, escribe cookies refrescadas en res.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Cargar rol — solo si la ruta lo necesita.
  const restricted = findRestrictedRoute(pathname);
  if (!restricted) return res;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const role = profile.role as StaffRole | "patient";
  const allowed = (restricted.allowed as ReadonlyArray<string>).includes(role);

  if (!allowed) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("notice", "no-permission");
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agenda/:path*",
    "/pacientes/:path*",
    "/doctores/:path*",
    "/contenidos/:path*",
    "/facturacion/:path*",
    "/usuarios/:path*",
    "/configuracion/:path*",
    "/perfil/:path*",
  ],
};
