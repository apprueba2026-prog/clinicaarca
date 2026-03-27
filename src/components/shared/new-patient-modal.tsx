"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/stores/modal.store";
import { patientSchema, type PatientFormData } from "@/lib/validators/patient.schema";
import { patientsService } from "@/lib/services/patients.service";

export function NewPatientModal() {
  const { activeModal, closeModal } = useModalStore();
  const isOpen = activeModal === "new-patient";
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: PatientFormData) =>
      patientsService.create({
        ...data,
        email: data.email || null,
        birth_date: data.birth_date || null,
        address: data.address || null,
        insurance_partner_id: data.insurance_partner_id ?? null,
        insurance_policy_number: data.insurance_policy_number || null,
        notes: data.notes || null,
        avatar_url: null,
        is_premium: false,
        status: "new",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
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
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={closeModal}
      />

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Nuevo Paciente
            </h3>
            <p className="text-xs text-slate-500">
              Registre los datos del nuevo paciente.
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
            {/* DNI */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                DNI
              </label>
              <input
                type="text"
                maxLength={8}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                placeholder="8 dígitos"
                {...register("dni")}
              />
              {errors.dni && (
                <p className="text-xs text-error">{errors.dni.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Teléfono
              </label>
              <input
                type="tel"
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                placeholder="+51 999 999 999"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-xs text-error">{errors.phone.message}</p>
              )}
            </div>

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Nombres
              </label>
              <input
                type="text"
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                {...register("first_name")}
              />
              {errors.first_name && (
                <p className="text-xs text-error">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            {/* Apellido */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Apellidos
              </label>
              <input
                type="text"
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                {...register("last_name")}
              />
              {errors.last_name && (
                <p className="text-xs text-error">
                  {errors.last_name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Email (opcional)
              </label>
              <input
                type="email"
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                {...register("email")}
              />
            </div>

            {/* Fecha de nacimiento */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Fecha Nacimiento
              </label>
              <input
                type="date"
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                {...register("birth_date")}
              />
            </div>

            {/* Dirección */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Dirección (opcional)
              </label>
              <input
                type="text"
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm"
                {...register("address")}
              />
            </div>

            {/* Notas */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Notas (opcional)
              </label>
              <textarea
                rows={2}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                {...register("notes")}
              />
            </div>
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
                  <Icon name="person_add" size="sm" />
                  Registrar Paciente
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
