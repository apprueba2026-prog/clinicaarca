"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/stores/modal.store";
import { appointmentSchema, type AppointmentFormData } from "@/lib/validators/appointment.schema";
import { appointmentsService } from "@/lib/services/appointments.service";
import { doctorsService } from "@/lib/services/doctors.service";
import { proceduresService } from "@/lib/services/procedures.service";
import { patientsService } from "@/lib/services/patients.service";

export function NewAppointmentModal() {
  const { activeModal, closeModal } = useModalStore();
  const isOpen = activeModal === "new-appointment";
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      priority: "normal",
      scheduled_date: new Date().toISOString().split("T")[0],
      start_time: "09:00",
      end_time: "09:30",
    },
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => doctorsService.getAll(),
    enabled: isOpen,
  });

  const { data: procedures } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => proceduresService.getActive(),
    enabled: isOpen,
  });

  const { data: patients } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: () => patientsService.getAll(0, 100),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: AppointmentFormData) =>
      appointmentsService.create({
        ...data,
        status: "pending",
        procedure_id: data.procedure_id ?? null,
        notes: data.notes ?? null,
        room: data.room ?? null,
        created_by: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["kpi"] });
      reset();
      closeModal();
    },
  });

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={closeModal}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Agendar Nueva Cita
            </h3>
            <p className="text-xs text-slate-500">
              Complete los detalles para confirmar el espacio.
            </p>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="p-6 space-y-5"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Paciente */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Paciente
              </label>
              <div className="relative">
                <select
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-10 focus:ring-2 focus:ring-primary/20 text-sm"
                  {...register("patient_id")}
                >
                  <option value="">Seleccionar Paciente...</option>
                  {patients?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} — {p.dni}
                    </option>
                  ))}
                </select>
                <Icon
                  name="person"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
              {errors.patient_id && (
                <p className="text-xs text-error">{errors.patient_id.message}</p>
              )}
            </div>

            {/* Doctor */}
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

            {/* Procedimiento */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Procedimiento
              </label>
              <select
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                {...register("procedure_id")}
              >
                <option value="">Opcional...</option>
                {procedures?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Fecha
              </label>
              <input
                type="date"
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                {...register("scheduled_date")}
              />
              {errors.scheduled_date && (
                <p className="text-xs text-error">
                  {errors.scheduled_date.message}
                </p>
              )}
            </div>

            {/* Hora */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Hora inicio
              </label>
              <input
                type="time"
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                {...register("start_time")}
              />
              {errors.start_time && (
                <p className="text-xs text-error">
                  {errors.start_time.message}
                </p>
              )}
            </div>

            {/* Hora fin */}
            <div className="space-y-1.5 col-span-2">
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

          {/* Info Banner */}
          <div className="p-4 bg-sky-50 dark:bg-sky-900/30 rounded-xl flex gap-3">
            <Icon name="info" className="text-sky-600 dark:text-sky-400 shrink-0" />
            <p className="text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed font-medium">
              Se enviará un mensaje automático de confirmación al paciente vía
              WhatsApp al guardar la cita.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Icon
                    name="progress_activity"
                    size="sm"
                    className="animate-spin"
                  />
                  Guardando...
                </>
              ) : (
                <>
                  <Icon name="chat" size="sm" />
                  Guardar y Notificar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
