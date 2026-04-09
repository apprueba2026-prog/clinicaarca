"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSupabase } from "@/hooks/use-supabase";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  patientSignupSchema,
  type PatientSignupFormData,
} from "@/lib/validators/auth.schema";

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}

function RegistroForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const nextUrl = searchParams.get("next");
  const restore = searchParams.get("restore");
  const isFromBooking = nextUrl === "/agendar-cita" && restore === "1";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientSignupFormData>({
    resolver: zodResolver(patientSignupSchema),
  });

  const onSubmit = async (data: PatientSignupFormData) => {
    setAuthError(null);
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          dni: data.dni,
          phone: data.phone,
          role: "patient",
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    // Si Supabase requiere confirmación de email
    if (authData.user && !authData.session) {
      setEmailSent(true);
      return;
    }

    // Login automático exitoso — redirigir
    if (nextUrl) {
      const redirectUrl = restore
        ? `${nextUrl}?restore=${restore}`
        : nextUrl;
      router.push(redirectUrl);
    } else {
      router.push("/mi-cuenta");
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

  if (emailSent) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-inverse-primary">
            <Icon name="mark_email_read" size="lg" />
          </div>
        </div>
        <h1 className="text-2xl font-headline font-bold text-on-surface dark:text-white mb-3">
          Revisa tu correo
        </h1>
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          Te hemos enviado un enlace de confirmación. Revisa tu bandeja de
          entrada y haz clic en el enlace para activar tu cuenta.
        </p>
        <Link
          href={buildAuthLink("/login")}
          className="inline-flex items-center gap-1.5 text-sm text-primary dark:text-inverse-primary font-semibold hover:underline"
        >
          <Icon name="arrow_back" size="sm" />
          Volver a Iniciar Sesión
        </Link>
      </div>
    );
  }

  const inputClass = (hasError: boolean) =>
    `w-full pl-11 pr-4 py-3 rounded-xl border bg-surface-container-low dark:bg-slate-900/60 text-on-surface dark:text-white text-sm placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all ${
      hasError
        ? "border-error"
        : "border-outline-variant dark:border-slate-700"
    }`;

  return (
    <div>
      {/* Logo mobile */}
      <div className="flex justify-center mb-6 lg:hidden">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/25">
          <Icon name="medical_services" filled size="lg" />
        </div>
      </div>

      {/* Banner de booking */}
      {isFromBooking && (
        <div className="mb-6 p-3.5 rounded-xl bg-primary-fixed/40 dark:bg-primary/10 text-on-primary-fixed dark:text-inverse-primary text-sm flex items-center gap-2.5 border border-primary/20">
          <Icon name="event_available" size="sm" />
          Crea tu cuenta para confirmar tu cita
        </div>
      )}

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface dark:text-white text-center lg:text-left">
          Crear Cuenta
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant text-center lg:text-left">
          Regístrate para gestionar tus citas en Clínica Arca
        </p>
      </div>

      {/* Error */}
      {authError && (
        <div className="mb-6 p-3.5 rounded-xl bg-error-container/80 dark:bg-error-container/20 text-on-error-container dark:text-error text-sm flex items-center gap-2.5 border border-error/20">
          <Icon name="error" size="sm" />
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Nombre y Apellido (2 columnas) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
            >
              Nombre
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="person" size="sm" />
              </span>
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                placeholder="Juan"
                className={inputClass(!!errors.first_name)}
                {...register("first_name")}
              />
            </div>
            {errors.first_name && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1">
                <Icon name="error" size="xs" />
                {errors.first_name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
            >
              Apellido
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="person" size="sm" />
              </span>
              <input
                id="last_name"
                type="text"
                autoComplete="family-name"
                placeholder="Pérez"
                className={inputClass(!!errors.last_name)}
                {...register("last_name")}
              />
            </div>
            {errors.last_name && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1">
                <Icon name="error" size="xs" />
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        {/* DNI y Teléfono (2 columnas) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="dni"
              className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
            >
              DNI
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="badge" size="sm" />
              </span>
              <input
                id="dni"
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="12345678"
                className={inputClass(!!errors.dni)}
                {...register("dni")}
              />
            </div>
            {errors.dni && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1">
                <Icon name="error" size="xs" />
                {errors.dni.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
            >
              Teléfono
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="phone" size="sm" />
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="987654321"
                className={inputClass(!!errors.phone)}
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1">
                <Icon name="error" size="xs" />
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>

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
              className={inputClass(!!errors.email)}
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
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
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

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirm_password"
            className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
          >
            Confirmar contraseña
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="lock" size="sm" />
            </span>
            <input
              id="confirm_password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              className={inputClass(!!errors.confirm_password)}
              {...register("confirm_password")}
            />
          </div>
          {errors.confirm_password && (
            <p className="mt-1.5 text-xs text-error flex items-center gap-1">
              <Icon name="error" size="xs" />
              {errors.confirm_password.message}
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
              <Icon
                name="progress_activity"
                size="sm"
                className="animate-spin"
              />
              Registrando...
            </>
          ) : (
            <>
              <Icon name="person_add" size="sm" />
              Crear cuenta
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-8 space-y-4">
        <div className="border-t border-outline-variant/30 dark:border-slate-800 pt-4">
          <p className="text-center text-sm text-on-surface-variant">
            ¿Ya tienes cuenta?{" "}
            <Link
              href={buildAuthLink("/login")}
              className="text-primary dark:text-inverse-primary font-semibold hover:underline"
            >
              Iniciar sesión
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
