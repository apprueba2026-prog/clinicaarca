"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/hooks/use-supabase";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setAuthError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-lg w-full">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white">
          <Icon name="medical_services" filled size="lg" />
        </div>
      </div>

      <h1 className="text-2xl font-headline font-bold text-on-surface text-center">
        Iniciar Sesión
      </h1>
      <p className="mt-2 text-sm text-on-surface-variant text-center mb-8">
        Accede al panel de administración de Clínica Arca
      </p>

      {/* Auth Error */}
      {authError && (
        <div className="mb-6 p-3 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2">
          <Icon name="error" size="sm" />
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-on-surface mb-1.5"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="mail" size="sm" />
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="doctor@clinicaarca.pe"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-surface-container-low dark:bg-slate-900 text-on-surface text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all ${
                errors.email
                  ? "border-error"
                  : "border-outline-variant"
              }`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-error">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-on-surface mb-1.5"
          >
            Contraseña
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="lock" size="sm" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-surface-container-low dark:bg-slate-900 text-on-surface text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all ${
                errors.password
                  ? "border-error"
                  : "border-outline-variant"
              }`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon
                name={showPassword ? "visibility_off" : "visibility"}
                size="sm"
              />
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-error">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
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

      <p className="mt-6 text-center text-xs text-on-surface-variant">
        ¿Olvidaste tu contraseña?{" "}
        <button className="text-primary font-semibold hover:underline cursor-pointer">
          Recuperar acceso
        </button>
      </p>
    </div>
  );
}
