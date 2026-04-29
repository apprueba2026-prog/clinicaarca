"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/hooks/use-auth";

type Role = "admin" | "dentist" | "receptionist" | "patient";

interface UserRow {
  id: string;
  role: Role;
  is_active: boolean;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<Role, { label: string; color: string }> = {
  admin: {
    label: "Administrador",
    color: "bg-primary/10 text-primary border-primary/30",
  },
  dentist: {
    label: "Dentista",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  receptionist: {
    label: "Recepcionista",
    color: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300",
  },
  patient: {
    label: "Paciente",
    color: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
  },
};

const STAFF_ROLES: Array<{ value: Role; label: string }> = [
  { value: "admin", label: "Administrador" },
  { value: "dentist", label: "Dentista" },
  { value: "receptionist", label: "Recepcionista" },
];

export default function UsuariosPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Role | "all">("all");
  const [showInvite, setShowInvite] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "err";
    message: string;
  } | null>(null);

  const showFeedback = (kind: "ok" | "err", message: string) => {
    setFeedback({ kind, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("role", filter);
      const res = await fetch(`/api/users?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error cargando");
      return json.users as UserRow[];
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (vars: { id: string; updates: Partial<UserRow> }) => {
      const res = await fetch(`/api/users/${vars.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars.updates),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error guardando");
      return json.user as UserRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showFeedback("ok", "✅ Usuario actualizado.");
    },
    onError: (e: Error) => showFeedback("err", `❌ ${e.message}`),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
            Gestión de Usuarios
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Administra el equipo del staff: roles, accesos y nuevas
            invitaciones.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Role | "all")}
            className="px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm cursor-pointer"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="dentist">Dentistas</option>
            <option value="receptionist">Recepcionistas</option>
            <option value="patient">Pacientes</option>
          </select>
          <Button onClick={() => setShowInvite(true)}>
            <Icon name="person_add" size="sm" />
            Invitar usuario
          </Button>
        </div>
      </header>

      {feedback && (
        <div
          className={cn(
            "px-4 py-3 rounded-xl text-sm",
            feedback.kind === "ok"
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-error/10 text-error border border-error/30"
          )}
        >
          {feedback.message}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low/50">
            <tr>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Usuario
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Email
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Rol
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Estado
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-on-surface-variant">
                    <Icon name="progress_activity" className="animate-spin" />
                    <span className="text-sm">Cargando…</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-on-surface-variant text-sm"
                >
                  Sin usuarios.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = profile?.id === u.id;
                const roleConfig = ROLE_LABELS[u.role];
                return (
                  <tr key={u.id} className="hover:bg-surface-container-low/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {(u.first_name ?? "?").charAt(0)}
                          {(u.last_name ?? "?").charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            {u.first_name} {u.last_name}
                            {isSelf && (
                              <span className="ml-2 text-[10px] text-primary font-bold">
                                (tú)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">
                      {u.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border",
                            roleConfig.color
                          )}
                        >
                          {roleConfig.label}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) =>
                            patchMutation.mutate({
                              id: u.id,
                              updates: { role: e.target.value as Role },
                            })
                          }
                          disabled={patchMutation.isPending}
                          className="text-xs px-2 py-1 rounded-lg border border-outline-variant bg-surface-container-lowest cursor-pointer"
                        >
                          {STAFF_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                          <option value="patient">Paciente</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                          u.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            u.is_active ? "bg-emerald-500" : "bg-slate-400"
                          )}
                        />
                        {u.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isSelf && (
                        <button
                          onClick={() =>
                            patchMutation.mutate({
                              id: u.id,
                              updates: { is_active: !u.is_active },
                            })
                          }
                          disabled={patchMutation.isPending}
                          className={cn(
                            "text-xs font-bold cursor-pointer hover:underline",
                            u.is_active ? "text-error" : "text-emerald-600"
                          )}
                        >
                          {u.is_active ? "Desactivar" : "Activar"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onSuccess={(email) => {
            setShowInvite(false);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            showFeedback(
              "ok",
              `✅ Invitación enviada a ${email}. Recibirá un email con un magic link.`
            );
          }}
          onError={(msg) => showFeedback("err", `❌ ${msg}`)}
        />
      )}
    </div>
  );
}

// ---------- Modal Invitar ----------
function InviteUserModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: (email: string) => void;
  onError: (msg: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"admin" | "dentist" | "receptionist">(
    "receptionist"
  );

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          role,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error invitando");
      return json;
    },
    onSuccess: () => onSuccess(email),
    onError: (e: Error) => onError(e.message),
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h3 className="text-lg font-bold">Invitar nuevo usuario</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container-low rounded-full"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-on-surface-variant">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <label className="block">
            <span className="text-xs font-medium text-on-surface-variant">
              Rol
            </span>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "admin" | "dentist" | "receptionist")
              }
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm cursor-pointer"
            >
              <option value="receptionist">Recepcionista</option>
              <option value="dentist">Dentista</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Le enviaremos un email con un magic link para que configure su
            contraseña la primera vez.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low/30">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => inviteMutation.mutate()}
            disabled={
              inviteMutation.isPending ||
              !email ||
              !firstName ||
              !lastName
            }
          >
            {inviteMutation.isPending ? "Enviando…" : "Enviar invitación"}
          </Button>
        </div>
      </div>
    </div>
  );
}
