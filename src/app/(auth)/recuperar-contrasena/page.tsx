"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSupabase } from "@/hooks/use-supabase";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validators/auth.schema";

export default function RecuperarContrasenaPage() {
  const supabase = useSupabase();
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/cambiar-contrasena`,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    setEmailSent(true);
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
          Correo enviado
        </h1>
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          Si el correo está registrado, recibirás un enlace para restablecer tu
          contraseña. Revisa tu bandeja de entrada.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-primary dark:text-inverse-primary font-semibold hover:underline"
        >
          <Icon name="arrow_back" size="sm" />
          Volver a Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Logo mobile */}
      <div className="flex justify-center mb-6 lg:hidden">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/25">
          <Icon name="medical_services" filled size="lg" />
        </div>
      </div>

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface dark:text-white text-center lg:text-left">
          Recuperar Contraseña
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant text-center lg:text-left">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
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
              Enviando...
            </>
          ) : (
            <>
              <Icon name="send" size="sm" />
              Enviar enlace
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-8 space-y-4">
        <div className="border-t border-outline-variant/30 dark:border-slate-800 pt-4">
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-on-surface-variant hover:text-primary dark:hover:text-inverse-primary transition-colors"
          >
            <Icon name="arrow_back" size="sm" />
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
