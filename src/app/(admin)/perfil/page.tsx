"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSupabase } from "@/hooks/use-supabase";

interface Profile {
  id: string;
  role: string;
  is_active: boolean;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  dentist: "Dentista",
  receptionist: "Recepcionista",
  patient: "Paciente",
};

export default function PerfilPage() {
  const { refreshProfile, user } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  // Bug fix v1.2: incluir user.id en la queryKey. Sin esto, TanStack Query
  // reusaba el cache entre usuarios distintos en la misma pestaña, mostrando
  // (por ejemplo) los datos de Aldrick cuando Dina iniciaba sesión.
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-me", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/profile/me");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error cargando perfil");
      return json.profile as Profile;
    },
    enabled: !!user?.id,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackKind, setFeedbackKind] = useState<"ok" | "err" | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const showFeedback = (kind: "ok" | "err", message: string) => {
    setFeedbackKind(kind);
    setFeedback(message);
    setTimeout(() => {
      setFeedback(null);
      setFeedbackKind(null);
    }, 5000);
  };

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error guardando");
      return json.profile as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      void refreshProfile();
      showFeedback("ok", "✅ Datos guardados correctamente.");
    },
    onError: (e: Error) => showFeedback("err", `❌ ${e.message}`),
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
    },
    onSuccess: () => {
      showFeedback(
        "ok",
        "✅ Te enviamos un email de verificación al nuevo correo. Confírmalo para que el cambio se aplique."
      );
      setNewEmail("");
    },
    onError: (e: Error) => showFeedback("err", `❌ ${e.message}`),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showFeedback("ok", "✅ Contraseña actualizada.");
      setNewPassword("");
    },
    onError: (e: Error) => showFeedback("err", `❌ ${e.message}`),
  });

  if (isLoading || !profile) {
    return (
      <div className="flex items-center gap-3 text-on-surface-variant py-12">
        <Icon name="progress_activity" className="animate-spin" />
        <span className="text-sm">Cargando perfil…</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Mi Perfil
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Administra tus datos personales y credenciales de acceso.
        </p>
      </header>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl text-sm ${
            feedbackKind === "ok"
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-error/10 text-error border border-error/30"
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Card: rol */}
      <div className="rounded-2xl bg-surface-container-low p-6 border border-outline-variant">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
            {(profile.first_name ?? "?").charAt(0)}
            {(profile.last_name ?? "?").charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-on-surface-variant">
              {ROLE_LABELS[profile.role] ?? profile.role} · {profile.email}
            </p>
          </div>
        </div>
      </div>

      {/* Datos personales */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 border border-outline-variant space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface uppercase tracking-widest">
          Datos personales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-on-surface-variant">
              Nombre
            </span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-on-surface-variant">
              Apellidos
            </span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs font-medium text-on-surface-variant">
              Teléfono
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+51 9XX XXX XXX"
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => profileMutation.mutate()}
            disabled={profileMutation.isPending}
          >
            {profileMutation.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </section>

      {/* Email */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 border border-outline-variant space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface uppercase tracking-widest">
          Cambiar email
        </h3>
        <p className="text-xs text-on-surface-variant">
          Actualmente: <strong>{profile.email}</strong>. Cambiar el email
          requiere verificación en el nuevo correo.
        </p>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="nuevo@email.com"
            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
          />
          <Button
            variant="outline"
            onClick={() => emailMutation.mutate()}
            disabled={emailMutation.isPending || !newEmail}
          >
            {emailMutation.isPending ? "Enviando…" : "Cambiar email"}
          </Button>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 border border-outline-variant space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface uppercase tracking-widest">
          Cambiar contraseña
        </h3>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña (mín. 8 caracteres)"
            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
          />
          <Button
            variant="outline"
            onClick={() => passwordMutation.mutate()}
            disabled={passwordMutation.isPending || newPassword.length < 8}
          >
            {passwordMutation.isPending ? "Actualizando…" : "Actualizar"}
          </Button>
        </div>
      </section>
    </div>
  );
}
