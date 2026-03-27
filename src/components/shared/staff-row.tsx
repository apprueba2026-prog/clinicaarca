"use client";

import { Icon } from "@/components/ui/icon";
import type { DoctorWithStaffInfo } from "@/lib/services/staff.service";

interface StaffRowProps {
  doctor: DoctorWithStaffInfo;
  onEdit: (id: string) => void;
}

const SPECIALTY_LABELS: Record<string, string> = {
  general: "Odontología General",
  odontopediatria: "Odontopediatría",
  implantes: "Implantes Dentales",
  ortodoncia: "Ortodoncia",
  sedacion: "Sedación",
  cirugia: "Cirugía Oral",
  estetica: "Estética Dental",
  endodoncia: "Endodoncia",
  periodoncia: "Periodoncia",
};

export function StaffRow({ doctor, onEdit }: StaffRowProps) {
  const fullName = `${doctor.profile.first_name} ${doctor.profile.last_name}`;
  const specialtyLabel =
    SPECIALTY_LABELS[doctor.specialty] ?? doctor.specialty;

  return (
    <tr className="group">
      <td className="py-4 px-2">
        <div className="flex items-center gap-3">
          {doctor.profile.avatar_url ? (
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <img
                src={doctor.profile.avatar_url}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-700 dark:text-sky-400 font-bold text-sm">
              {doctor.profile.first_name.charAt(0)}
              {doctor.profile.last_name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-bold text-sm text-on-surface dark:text-white leading-tight">
              {fullName}
            </p>
            <p className="text-xs text-slate-500">{specialtyLabel}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-2">
        {doctor.is_public ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Público
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Borrador
          </span>
        )}
      </td>
      <td className="py-4 px-2 text-right">
        <button
          onClick={() => onEdit(doctor.id)}
          className="p-1.5 text-slate-400 hover:text-primary transition-colors cursor-pointer"
        >
          <Icon name="edit" size="sm" />
        </button>
      </td>
    </tr>
  );
}
