"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/stores/modal.store";
import { doctorsService } from "@/lib/services/doctors.service";
import {
  appointmentBlockSchema,
  type AppointmentBlockFormData,
} from "@/lib/validators/appointment-block.schema";

export function NewBlockModal() {
  const { activeModal, closeModal: storeClose } = useModalStore();
  const isOpen = activeModal === "new-block";
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [allDay, setAllDay] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentBlockFormData>({
    resolver: zodResolver(appointmentBlockSchema),
    defaultValues: {
      block_type: "fixed_patients",
      block_date: new Date().toISOString().split("T")[0],
    },
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => doctorsService.getAll(),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: AppointmentBlockFormData) => {
      const payload = allDay
        ? { ...data, start_time: null, end_time: null }
        : data;
      const res = await fetch("/api/appointment-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Error al crear pre-reserva");
      }
      return json.block;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-blocks"] });
      closeAndReset();
    },
    onError: (err: Error) => setSubmitError(err.message),
  });

  const closeAndReset = useCallback(() => {
    reset();
    setSubmitError(null);
    setAllDay(true);
    storeClose();
  }, [reset, storeClose]);

  if (!isOpen) return null;
  const closeModal = closeAndReset;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={closeModal}
      />

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Pre-reservar horario
            </h3>
            <p className="text-xs text-slate-500">
              Bloquea un día o rango horario para clientes fijos o ausencias.
            </p>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Cerrar"
          >
            <Icon name="close" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="p-6 space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Doctor(a)
            </label>
            <select
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
              {...register("doctor_id")}
            >
              <option value="">Seleccionar...</option>
              {doctors?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.profile.first_name} {d.profile.last_name}
                </option>
              ))}
            </select>
            {errors.doctor_id && (
              <p className="text-xs text-error">{errors.doctor_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tipo de pre-reserva
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="fixed_patients"
                  className="peer sr-only"
                  {...register("block_type")}
                />
                <div className="p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl peer-checked:border-primary peer-checked:bg-primary/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="people" size="sm" className="text-primary" />
                    <span className="text-xs font-bold">Pacientes fijos</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Reservado para clientes recurrentes. La admin puede agendar dentro.
                  </p>
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="unavailable"
                  className="peer sr-only"
                  {...register("block_type")}
                />
                <div className="p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl peer-checked:border-error peer-checked:bg-error/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="block" size="sm" className="text-error" />
                    <span className="text-xs font-bold">No disponible</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Vacaciones, viajes o urgencias. Nadie puede agendar.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Fecha
              </label>
              <input
                type="date"
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                {...register("block_date")}
              />
              {errors.block_date && (
                <p className="text-xs text-error">{errors.block_date.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Alcance
              </label>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setAllDay(true)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${allDay ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-500"}`}
                >
                  Día completo
                </button>
                <button
                  type="button"
                  onClick={() => setAllDay(false)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${!allDay ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-500"}`}
                >
                  Rango horario
                </button>
              </div>
            </div>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Hora inicio
                </label>
                <input
                  type="time"
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                  {...register("start_time")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Hora fin
                </label>
                <input
                  type="time"
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                  {...register("end_time")}
                />
                {errors.end_time && (
                  <p className="text-xs text-error">{errors.end_time.message}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Título (opcional)
            </label>
            <input
              type="text"
              placeholder='Ej. "Pacientes fijos miércoles" o "Vacaciones"'
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
              {...register("title")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Notas (opcional)
            </label>
            <textarea
              rows={2}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm resize-none"
              {...register("notes")}
            />
          </div>

          {submitError && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-xl flex gap-2">
              <Icon name="error" size="sm" className="text-error shrink-0 mt-0.5" />
              <p className="text-xs text-error font-medium">{submitError}</p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Icon name="progress_activity" size="sm" className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Icon name="event_busy" size="sm" />
                  Crear pre-reserva
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
