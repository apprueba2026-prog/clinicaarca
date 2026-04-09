"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useMyPastAppointments } from "@/hooks/use-my-appointments";
import { PatientAppointmentCard } from "./patient-appointment-card";

export function PastAppointments() {
  const [page, setPage] = useState(0);
  const { data: appointments, isLoading, error } = useMyPastAppointments(page);

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
          Error al cargar el historial. Intenta de nuevo.
        </p>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    if (page === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-container dark:bg-slate-800 flex items-center justify-center text-on-surface-variant mb-4">
            <Icon name="history" size="lg" />
          </div>
          <h3 className="text-lg font-headline font-bold text-on-surface dark:text-white mb-2">
            Sin historial
          </h3>
          <p className="text-sm text-on-surface-variant">
            Aquí aparecerán tus citas pasadas
          </p>
        </div>
      );
    }
    // Si no hay más páginas, mostrar solo el botón de volver
    setPage((p) => Math.max(0, p - 1));
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <p className="text-sm text-on-surface-variant">
        Historial de citas{page > 0 ? ` — Página ${page + 1}` : ""}
      </p>

      {/* Cards */}
      <div className="space-y-3">
        {appointments.map((apt) => (
          <PatientAppointmentCard key={apt.id} appointment={apt} />
        ))}
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          <Icon name="chevron_left" size="sm" />
          Anterior
        </Button>
        {appointments.length === 10 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
            <Icon name="chevron_right" size="sm" />
          </Button>
        )}
      </div>
    </div>
  );
}
