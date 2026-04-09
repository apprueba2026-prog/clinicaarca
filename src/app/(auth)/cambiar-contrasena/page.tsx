"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSupabase } from "@/hooks/use-supabase";
import { useAuth } from "@/hooks/use-auth";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validators/auth.schema";

export default function CambiarContrasenaPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Si no hay sesión activa, redirigir a recuperar contraseña
  useEffect(() => {
    if (!loading && !user) {
      router.push("/recuperar-contrasena");
    }
  }, [loading, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setAuthError(null);
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="progress_activity" size="lg" className="animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-inverse-primary">
            <Icon name="check_circle" size="lg" />
          </div>
        </div>
        <h1 className="text-2xl font-headline font-bold text-on-surface dark:text-white mb-3">
          Contraseña actualizada
        </h1>
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión
          con tu nueva contraseña.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-primary dark:text-inverse-primary font-semibold hover:underline"
        >
          <Icon name="login" size="sm" />
          Iniciar Sesión
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
          Cambiar Contraseña
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant text-center lg:text-left">
          Ingresa tu nueva contraseña
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
        {/* Nueva contraseña */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
          >
            Nueva contraseña
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

        {/* Confirmar contraseña */}
        <div>
          <label
            htmlFor="confirm_password"
            className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
          >
            Confirmar nueva contraseña
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
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-surface-container-low dark:bg-slate-900/60 text-on-surface dark:text-white text-sm placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all ${
                errors.confirm_password
                  ? "border-error"
                  : "border-outline-variant dark:border-slate-700"
              }`}
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
              <Icon name="progress_activity" size="sm" className="animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              <Icon name="lock_reset" size="sm" />
              Cambiar contraseña
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
