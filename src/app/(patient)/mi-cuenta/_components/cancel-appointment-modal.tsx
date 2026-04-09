"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
}

export function CancelAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  appointmentDate,
  appointmentTime,
}: CancelAppointmentModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isLoading) onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-800 shadow-2xl p-6">
        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-error/10 dark:bg-error/20 flex items-center justify-center text-error">
            <Icon name="event_busy" size="lg" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-lg font-headline font-bold text-on-surface dark:text-white text-center mb-2">
          ¿Cancelar esta cita?
        </h2>

        {/* Detalle */}
        {appointmentDate && (
          <p className="text-sm text-on-surface-variant text-center mb-1">
            {appointmentDate}
          </p>
        )}
        {appointmentTime && (
          <p className="text-sm text-on-surface-variant text-center mb-4">
            Hora: {appointmentTime}
          </p>
        )}

        <p className="text-xs text-on-surface-variant text-center mb-6 leading-relaxed">
          Esta acción no se puede deshacer. Podrás agendar una nueva cita desde
          el sitio web.
        </p>

        {/* Acciones */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            No, mantener
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icon name="progress_activity" size="sm" className="animate-spin" />
                Cancelando...
              </>
            ) : (
              <>
                <Icon name="event_busy" size="sm" />
                Sí, cancelar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
