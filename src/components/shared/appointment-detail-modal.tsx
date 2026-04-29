"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/stores/modal.store";
import { schedulingService } from "@/lib/services/scheduling.service";
import { cn } from "@/lib/utils/cn";

type Tab = "details" | "reschedule" | "cancel";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const PRIORITY_LABELS: Record<string, string> = {
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

interface AppointmentDetail {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  priority: string;
  notes: string | null;
  room: string | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    dni: string;
    phone: string;
    email: string | null;
  } | null;
  doctor: {
    id: string;
    profile: { first_name: string; last_name: string };
  } | null;
}

async function fetchAppointment(id: string): Promise<AppointmentDetail> {
  const res = await fetch(`/api/appointments/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Error cargando cita");
  return json.appointment;
}

export function AppointmentDetailModal() {
  const { activeModal, modalData, closeModal } = useModalStore();
  const isOpen = activeModal === "appointment-detail";
  const appointmentId = (modalData?.appointmentId as string) ?? null;
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("details");
  const [editStatus, setEditStatus] = useState<AppointmentStatus>("confirmed");
  const [editPriority, setEditPriority] = useState<string>("normal");
  const [editRoom, setEditRoom] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Reschedule state
  const [newDate, setNewDate] = useState<string>("");
  const [newSlot, setNewSlot] = useState<{ start: string; end: string } | null>(
    null
  );

  const { data: appointment, isLoading } = useQuery({
    queryKey: ["appointment-detail", appointmentId],
    queryFn: () => fetchAppointment(appointmentId!),
    enabled: isOpen && !!appointmentId,
  });

  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: [
      "available-slots-admin",
      appointment?.doctor?.id,
      newDate,
    ],
    queryFn: () =>
      schedulingService.getAvailableSlots(
        appointment!.doctor!.id,
        newDate,
        30,
        true
      ),
    enabled:
      tab === "reschedule" && !!appointment?.doctor?.id && !!newDate,
  });

  // Sincronizar campos editables cuando llega la cita
  useEffect(() => {
    if (appointment) {
      setEditStatus(appointment.status);
      setEditPriority(appointment.priority ?? "normal");
      setEditRoom(appointment.room ?? "");
      setEditNotes(appointment.notes ?? "");
      setNewDate(appointment.scheduled_date);
      setNewSlot(null);
    }
  }, [appointment]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setTab("details");
      setError(null);
    }
  }, [isOpen]);

  const patchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
          room: editRoom || null,
          notes: editNotes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error guardando");
      return json.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({
        queryKey: ["appointment-detail", appointmentId],
      });
      closeModal();
    },
    onError: (e: Error) => setError(e.message),
  });

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!newSlot || !newDate) throw new Error("Selecciona fecha y hora");
      const res = await fetch(
        `/api/appointments/${appointmentId}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduled_date: newDate,
            start_time: newSlot.start,
            end_time: newSlot.end,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error reprogramando");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({
        queryKey: ["appointment-detail", appointmentId],
      });
      closeModal();
    },
    onError: (e: Error) => setError(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error cancelando");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      closeModal();
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!isOpen) return null;

  const patientName = appointment?.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : "—";
  const doctorName = appointment?.doctor
    ? `Dr(a). ${appointment.doctor.profile.first_name} ${appointment.doctor.profile.last_name}`
    : "—";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Cita
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {patientName} · {doctorName}
            </p>
          </div>
          <button
            onClick={closeModal}
            aria-label="Cerrar"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
          {[
            { id: "details" as const, label: "Detalles", icon: "info" },
            {
              id: "reschedule" as const,
              label: "Reprogramar",
              icon: "edit_calendar",
            },
            { id: "cancel" as const, label: "Cancelar", icon: "event_busy" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setError(null);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Icon name={t.icon} size="sm" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading || !appointment ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Icon name="progress_activity" className="animate-spin" />
              <span className="ml-2 text-sm">Cargando…</span>
            </div>
          ) : tab === "details" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Fecha</p>
                  <p className="font-semibold">{appointment.scheduled_date}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Hora</p>
                  <p className="font-semibold">
                    {appointment.start_time.slice(0, 5)} —{" "}
                    {appointment.end_time.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Paciente</p>
                  <p className="font-semibold">{patientName}</p>
                  <p className="text-xs text-slate-500">
                    DNI {appointment.patient?.dni} ·{" "}
                    {appointment.patient?.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Doctor(a)</p>
                  <p className="font-semibold">{doctorName}</p>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Estado
                  </span>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as AppointmentStatus)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map(
                      (s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Prioridad
                  </span>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block col-span-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Sala / Consultorio
                  </span>
                  <input
                    type="text"
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    placeholder="Ej. Consultorio 1"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block col-span-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Notas
                  </span>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    placeholder="Observaciones internas…"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>
          ) : tab === "reschedule" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Selecciona una nueva fecha y horario para esta cita. El paciente recibirá
                un email automático y el doctor una notificación por Telegram.
              </p>
              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Nueva fecha
                </span>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setNewSlot(null);
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                />
              </label>
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-2">
                  Horarios disponibles
                </span>
                {loadingSlots ? (
                  <div className="flex items-center text-slate-400 text-sm py-4">
                    <Icon name="progress_activity" className="animate-spin" />
                    <span className="ml-2">Cargando horarios…</span>
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-slate-500 py-3">
                    No hay horarios libres ese día.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((s) => {
                      const start = (s.slot_start as string).slice(0, 5);
                      const end = (s.slot_end as string).slice(0, 5);
                      const selected =
                        newSlot?.start === start && newSlot?.end === end;
                      return (
                        <button
                          key={start}
                          type="button"
                          onClick={() => setNewSlot({ start, end })}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                            selected
                              ? "border-primary bg-primary text-on-primary shadow-sm"
                              : "border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          )}
                        >
                          {start}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-error/10 border border-error/30 p-4 text-sm text-error">
                <p className="font-bold mb-1">¿Cancelar esta cita?</p>
                <p>
                  El paciente recibirá un email automático notificando la
                  cancelación, y el doctor una notificación por Telegram. Esta
                  acción no se puede deshacer fácilmente.
                </p>
              </div>
              <div className="text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  Cita a cancelar:
                </p>
                <p className="font-semibold mt-1">
                  {patientName} · {appointment.scheduled_date} ·{" "}
                  {appointment.start_time.slice(0, 5)}–
                  {appointment.end_time.slice(0, 5)}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-error/10 border border-error/30 px-4 py-2 text-sm text-error">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950">
          <Button variant="ghost" onClick={closeModal}>
            Cerrar
          </Button>
          {tab === "details" && (
            <Button
              onClick={() => patchMutation.mutate()}
              disabled={patchMutation.isPending}
            >
              {patchMutation.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          )}
          {tab === "reschedule" && (
            <Button
              onClick={() => rescheduleMutation.mutate()}
              disabled={!newSlot || rescheduleMutation.isPending}
            >
              {rescheduleMutation.isPending
                ? "Reprogramando…"
                : "Confirmar reprogramación"}
            </Button>
          )}
          {tab === "cancel" && (
            <Button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="bg-error hover:bg-error/90 text-white"
            >
              {cancelMutation.isPending ? "Cancelando…" : "Sí, cancelar cita"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
