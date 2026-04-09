"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  useMyUpcomingAppointments,
  useCancelAppointment,
} from "@/hooks/use-my-appointments";
import { PatientAppointmentCard } from "./patient-appointment-card";
import { CancelAppointmentModal } from "./cancel-appointment-modal";
import type { PatientAppointment } from "@/lib/services/patient-portal.service";

export function UpcomingAppointments() {
  const { data: appointments, isLoading, error } = useMyUpcomingAppointments();
  const cancelMutation = useCancelAppointment();
  const [cancelTarget, setCancelTarget] = useState<PatientAppointment | null>(null);

  const handleCancelClick = (appointmentId: string) => {
    const apt = appointments?.find((a) => a.id === appointmentId);
    if (apt) setCancelTarget(apt);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync(cancelTarget.id);
      setCancelTarget(null);
    } catch {
      // Error manejado por TanStack Query
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Icon name="progress_activity" size="lg" className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-error/10 dark:bg-error/20 flex items-center justify-center text-error mb-4">
          <Icon name="error" size="lg" />
        </div>
        <p className="text-sm text-on-surface-variant">
          Error al cargar tus citas. Intenta de nuevo.
        </p>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-inverse-primary mb-4">
          <Icon name="event_available" size="lg" />
        </div>
        <h3 className="text-lg font-headline font-bold text-on-surface dark:text-white mb-2">
          No tienes citas próximas
        </h3>
        <p className="text-sm text-on-surface-variant mb-6">
          Agenda tu primera consulta en pocos pasos
        </p>
        <Link href="/agendar-cita">
          <Button variant="primary" size="md" tabIndex={-1}>
            <Icon name="add" size="sm" />
            Agendar Cita
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          {appointments.length} cita{appointments.length !== 1 ? "s" : ""} próxima{appointments.length !== 1 ? "s" : ""}
        </p>
        <Link href="/agendar-cita">
          <Button variant="ghost" size="sm" tabIndex={-1}>
            <Icon name="add" size="sm" />
            Nueva cita
          </Button>
        </Link>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {appointments.map((apt) => (
          <PatientAppointmentCard
            key={apt.id}
            appointment={apt}
            showCancelButton
            onCancel={handleCancelClick}
          />
        ))}
      </div>

      {/* Cancel modal */}
      <CancelAppointmentModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        isLoading={cancelMutation.isPending}
        appointmentDate={
          cancelTarget
            ? new Date(cancelTarget.scheduled_date + "T12:00:00").toLocaleDateString(
                "es-PE",
                { weekday: "long", day: "numeric", month: "long" }
              )
            : undefined
        }
        appointmentTime={
          cancelTarget
            ? `${cancelTarget.start_time.slice(0, 5)} - ${cancelTarget.end_time.slice(0, 5)}`
            : undefined
        }
      />
    </div>
  );
}
