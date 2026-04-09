"use client";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { PatientAppointment } from "@/lib/services/patient-portal.service";

/** Mapeo de especialidades a labels en español */
const specialtyLabels: Record<string, string> = {
  general: "Odontología General",
  implantes: "Implantes Dentales",
  odontopediatria: "Odontopediatría",
  ortodoncia: "Ortodoncia",
  sedacion: "Sedación Dental",
  cirugia: "Cirugía Oral",
  estetica: "Estética Dental",
  endodoncia: "Endodoncia",
  periodoncia: "Periodoncia",
};

/** Mapeo de status a badge */
const statusConfig: Record<string, { label: string; icon: string; className: string }> = {
  pending: {
    label: "Pendiente",
    icon: "schedule",
    className: "bg-tertiary-container/60 text-on-tertiary-container dark:bg-tertiary/20 dark:text-tertiary",
  },
  confirmed: {
    label: "Confirmada",
    icon: "check_circle",
    className: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-inverse-primary",
  },
  completed: {
    label: "Completada",
    icon: "task_alt",
    className: "bg-surface-container text-on-surface-variant dark:bg-slate-800 dark:text-slate-400",
  },
  cancelled: {
    label: "Cancelada",
    icon: "cancel",
    className: "bg-error-container/60 text-on-error-container dark:bg-error/20 dark:text-error",
  },
  no_show: {
    label: "No asistió",
    icon: "person_off",
    className: "bg-error-container/40 text-on-error-container dark:bg-error/10 dark:text-error/80",
  },
  in_progress: {
    label: "En curso",
    icon: "play_circle",
    className: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-inverse-primary",
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

interface PatientAppointmentCardProps {
  appointment: PatientAppointment;
  onCancel?: (id: string) => void;
  showCancelButton?: boolean;
}

export function PatientAppointmentCard({
  appointment,
  onCancel,
  showCancelButton = false,
}: PatientAppointmentCardProps) {
  const doctorName = `Dr(a). ${appointment.doctor.profile.first_name} ${appointment.doctor.profile.last_name}`;
  const primarySpecialty = appointment.doctor.specialties?.[0] ?? "general";
  const specialty = specialtyLabels[primarySpecialty] ?? primarySpecialty;
  const status = statusConfig[appointment.status] ?? statusConfig.pending;

  // Verificar si se puede cancelar (24h antes)
  const canCancel = (() => {
    if (!showCancelButton) return false;
    if (!["pending", "confirmed"].includes(appointment.status)) return false;
    const appointmentTime = new Date(
      `${appointment.scheduled_date}T${appointment.start_time}`
    );
    const hoursUntil =
      (appointmentTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  })();

  return (
    <div className="rounded-2xl border border-outline-variant/30 dark:border-slate-800 bg-surface-container-lowest dark:bg-slate-900/50 p-5 transition-all hover:shadow-md">
      {/* Header: fecha + status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 text-on-surface dark:text-white">
          <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-inverse-primary">
            <Icon name="calendar_today" size="sm" />
          </div>
          <div>
            <p className="text-sm font-semibold capitalize">
              {formatDate(appointment.scheduled_date)}
            </p>
            <p className="text-xs text-on-surface-variant">
              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
            status.className
          )}
        >
          <Icon name={status.icon} size="xs" />
          {status.label}
        </span>
      </div>

      {/* Doctor + especialidad */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-slate-800 flex items-center justify-center text-on-surface-variant">
          <Icon name="stethoscope" size="sm" />
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface dark:text-white">
            {doctorName}
          </p>
          <p className="text-xs text-on-surface-variant">{specialty}</p>
        </div>
      </div>

      {/* Procedimiento si existe */}
      {appointment.procedure && (
        <div className="flex items-center gap-2 mb-3 text-xs text-on-surface-variant">
          <Icon name="medical_services" size="xs" />
          {appointment.procedure.name}
        </div>
      )}

      {/* Notas */}
      {appointment.notes && (
        <div className="mb-3 p-3 rounded-xl bg-surface-container-low dark:bg-slate-800/50 text-xs text-on-surface-variant leading-relaxed">
          <span className="font-medium text-on-surface dark:text-slate-300">Motivo: </span>
          {appointment.notes}
        </div>
      )}

      {/* Acción cancelar */}
      {canCancel && onCancel && (
        <div className="pt-3 border-t border-outline-variant/20 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(appointment.id)}
            className="text-error hover:bg-error/10 dark:hover:bg-error/20"
          >
            <Icon name="event_busy" size="sm" />
            Cancelar cita
          </Button>
        </div>
      )}
    </div>
  );
}
