"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import type { Patient } from "@/lib/types/patient";
import type { PaymentStatus } from "@/lib/types/enums";
import { formatDate } from "@/lib/utils/format-date";

interface PatientRowProps {
  patient: Patient;
  lastVisit: string | null;
  accountStatus: PaymentStatus | "al_dia";
  onView: () => void;
  onBilling: () => void;
}

const ACCOUNT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  al_dia: { label: "Al día", bg: "bg-green-100", text: "text-green-700" },
  paid: { label: "Al día", bg: "bg-green-100", text: "text-green-700" },
  pending: {
    label: "Saldo Pendiente",
    bg: "bg-red-100",
    text: "text-red-700",
  },
  partial: {
    label: "Pago Parcial",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  overdue: { label: "Vencido", bg: "bg-red-100", text: "text-red-700" },
  refunded: {
    label: "Reembolsado",
    bg: "bg-slate-100",
    text: "text-slate-600",
  },
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const AVATAR_COLORS = [
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function PatientRow({
  patient,
  lastVisit,
  accountStatus,
  onView,
  onBilling,
}: PatientRowProps) {
  const initials = getInitials(patient.first_name, patient.last_name);
  const colorClass = getAvatarColor(patient.first_name + patient.last_name);
  const statusConfig = ACCOUNT_STATUS_CONFIG[accountStatus] ?? ACCOUNT_STATUS_CONFIG.al_dia;

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
      {/* Paciente */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {patient.avatar_url ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={patient.avatar_url}
                alt={patient.first_name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${colorClass}`}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-on-surface">
              {patient.first_name} {patient.last_name}
            </p>
            <p className="text-xs text-slate-500">DNI: {patient.dni}</p>
          </div>
        </div>
      </td>

      {/* Contacto */}
      <td className="px-6 py-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {patient.phone}
        </p>
      </td>

      {/* Última Visita */}
      <td className="px-6 py-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {lastVisit ? formatDate(lastVisit) : "Sin visitas"}
        </p>
      </td>

      {/* Estado de Cuenta */}
      <td className="px-6 py-4">
        <span
          className={`px-3 py-1 ${statusConfig.bg} ${statusConfig.text} text-[10px] font-bold uppercase tracking-tight rounded-full`}
        >
          {statusConfig.label}
        </span>
      </td>

      {/* Acciones */}
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="p-2 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-700 rounded-lg cursor-pointer"
          >
            <Icon name="visibility" size="sm" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBilling();
            }}
            className="p-2 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-700 rounded-lg cursor-pointer"
          >
            <Icon name="payments" size="sm" />
          </button>
        </div>
      </td>
    </tr>
  );
}
