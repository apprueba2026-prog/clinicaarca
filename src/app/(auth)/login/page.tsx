"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSupabase } from "@/hooks/use-supabase";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginFormData } from "@/lib/validators/auth.schema";
import { getRoleRedirect } from "@/lib/utils/get-role-redirect";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const nextUrl = searchParams.get("next");
  const restore = searchParams.get("restore");
  const isFromBooking = nextUrl === "/agendar-cita" && restore === "1";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setAuthError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      return;
    }

    if (authData.user) {
      // Si viene del booking, redirigir al wizard con restore
      if (nextUrl) {
        const redirectUrl = restore
          ? `${nextUrl}?restore=${restore}`
          : nextUrl;
        router.push(redirectUrl);
      } else {
        router.push(getRoleRedirect(authData.user));
      }
    } else {
      router.push("/dashboard");
    }
  };

  // Helper para construir links preservando query params
  const buildAuthLink = (path: string) => {
    const params = new URLSearchParams();
    if (nextUrl) params.set("next", nextUrl);
    if (restore) params.set("restore", restore);
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  };

  return (
    <div>
      {/* Logo mobile — solo visible en pantallas sin panel izquierdo */}
      <div className="flex justify-center mb-6 lg:hidden">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/25">
          <Icon name="medical_services" filled size="lg" />
        </div>
      </div>

      {/* Banner de booking */}
      {isFromBooking && (
        <div className="mb-6 p-3.5 rounded-xl bg-primary-fixed/40 dark:bg-primary/10 text-on-primary-fixed dark:text-inverse-primary text-sm flex items-center gap-2.5 border border-primary/20">
          <Icon name="event_available" size="sm" />
          Inicia sesión para confirmar tu cita
        </div>
      )}

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface dark:text-white text-center lg:text-left">
          Iniciar Sesión
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant text-center lg:text-left">
          Accede a tu cuenta en Clínica Arca
        </p>
      </div>

      {/* Error de autenticación */}
      {authError && (
        <div className="mb-6 p-3.5 rounded-xl bg-error-container/80 dark:bg-error-container/20 text-on-error-container dark:text-error text-sm flex items-center gap-2.5 border border-error/20">
          <Icon name="error" size="sm" />
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="mail" size="sm" />
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-surface-container-low dark:bg-slate-900/60 text-on-surface dark:text-white text-sm placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all ${
                errors.email
                  ? "border-error"
                  : "border-outline-variant dark:border-slate-700"
              }`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-error flex items-center gap-1">
              <Icon name="error" size="xs" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
          >
            Contraseña
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="lock" size="sm" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`w-full pl-11 pr-12 py-3 rounded-xl border bg-surface-container-low dark:bg-slate-900/60 text-on-surface dark:text-white text-sm placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all ${
                errors.password
                  ? "border-error"
                  : "border-outline-variant dark:border-slate-700"
              }`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface dark:hover:text-white transition-colors cursor-pointer"
            >
              <Icon
                name={showPassword ? "visibility_off" : "visibility"}
                size="sm"
              />
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-error flex items-center gap-1">
              <Icon name="error" size="xs" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full mt-2"
        >
          {isSubmitting ? (
            <>
              <Icon name="progress_activity" size="sm" className="animate-spin" />
              Ingresando...
            </>
          ) : (
            <>
              <Icon name="login" size="sm" />
              Ingresar
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-8 space-y-4">
        <p className="text-center text-xs text-on-surface-variant">
          ¿Olvidaste tu contraseña?{" "}
          <Link
            href="/recuperar-contrasena"
            className="text-primary dark:text-inverse-primary font-semibold hover:underline"
          >
            Recuperar acceso
          </Link>
        </p>

        <div className="border-t border-outline-variant/30 dark:border-slate-800 pt-4">
          <p className="text-center text-sm text-on-surface-variant">
            ¿No tienes cuenta?{" "}
            <Link
              href={buildAuthLink("/registro")}
              className="text-primary dark:text-inverse-primary font-semibold hover:underline"
            >
              Crear una
            </Link>
          </p>
        </div>

        <div className="border-t border-outline-variant/30 dark:border-slate-800 pt-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant hover:text-primary dark:hover:text-inverse-primary transition-colors"
          >
            <Icon name="arrow_back" size="sm" />
            Volver al sitio web
          </Link>
        </div>
      </div>
    </div>
  );
}
