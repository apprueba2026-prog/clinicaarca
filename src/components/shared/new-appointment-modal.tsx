"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/stores/modal.store";
import {
  appointmentSchema,
  type AppointmentFormData,
} from "@/lib/validators/appointment.schema";
import { doctorsService } from "@/lib/services/doctors.service";
import { proceduresService } from "@/lib/services/procedures.service";
import { patientsService } from "@/lib/services/patients.service";
import { InlineNewPatientPanel } from "./inline-new-patient-panel";
import type { Patient } from "@/lib/types/patient";

export function NewAppointmentModal() {
  const { activeModal, closeModal: storeClose } = useModalStore();
  const isOpen = activeModal === "new-appointment";
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [useCustomProcedure, setUseCustomProcedure] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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

  const selectedPatientId = watch("patient_id");

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
    queryFn: () => patientsService.getAll(0, 200),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const res = await fetch("/api/appointments/admin-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Error al crear la cita");
      }
      return json.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["kpi"] });
      closeAndReset();
    },
    onError: (err: Error) => setSubmitError(err.message),
  });

  const closeAndReset = useCallback(() => {
    reset();
    setSubmitError(null);
    setShowNewPatient(false);
    setUseCustomProcedure(false);
    storeClose();
  }, [reset, storeClose]);

  function handlePatientCreated(patient: Patient) {
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    setValue("patient_id", patient.id, { shouldValidate: true });
    setShowNewPatient(false);
  }

  if (!isOpen) return null;
  const closeModal = closeAndReset;

  const onSubmit = (data: AppointmentFormData) => {
    setSubmitError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={closeModal}
      />

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl my-8 overflow-hidden">
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
            aria-label="Cerrar"
          >
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Paciente
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewPatient((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  <Icon name={showNewPatient ? "close" : "person_add"} size="sm" />
                  {showNewPatient ? "Cancelar" : "Nuevo paciente"}
                </button>
              </div>
              <div className="relative">
                <select
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-10 focus:ring-2 focus:ring-primary/20 text-sm"
                  value={selectedPatientId ?? ""}
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

              {showNewPatient && (
                <InlineNewPatientPanel
                  onCreated={handlePatientCreated}
                  onCancel={() => setShowNewPatient(false)}
                />
              )}
            </div>

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
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Procedimiento
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomProcedure((v) => {
                      const next = !v;
                      if (next) setValue("procedure_id", null);
                      else setValue("custom_procedure", null);
                      return next;
                    });
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  <Icon
                    name={useCustomProcedure ? "list" : "add"}
                    size="sm"
                  />
                  {useCustomProcedure ? "Catálogo" : "Personalizado"}
                </button>
              </div>
              {useCustomProcedure ? (
                <input
                  type="text"
                  placeholder="Nombre del procedimiento personalizado"
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                  {...register("custom_procedure")}
                />
              ) : (
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
              )}
              {errors.custom_procedure && (
                <p className="text-xs text-error">
                  {errors.custom_procedure.message}
                </p>
              )}
            </div>

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

            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Detalle / descripción del procedimiento
              </label>
              <textarea
                rows={3}
                placeholder="Información clínica, indicaciones previas, materiales, observaciones... Este detalle se incluirá en el correo de confirmación al paciente."
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                {...register("procedure_description")}
              />
            </div>
          </div>

          <div className="p-4 bg-sky-50 dark:bg-sky-900/30 rounded-xl flex gap-3">
            <Icon name="mail" className="text-sky-600 dark:text-sky-400 shrink-0" />
            <p className="text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed font-medium">
              Se enviará un mensaje automático de confirmación al paciente vía
              correo al guardar la cita.
            </p>
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
                  <Icon
                    name="progress_activity"
                    size="sm"
                    className="animate-spin"
                  />
                  Guardando...
                </>
              ) : (
                <>
                  <Icon name="mail" size="sm" />
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
