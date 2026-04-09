"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useMyProfile, useUpdateMyProfile } from "@/hooks/use-my-profile";
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from "@/lib/validators/patient-profile.schema";

export function PersonalInfoForm() {
  const { data: patient, isLoading } = useMyProfile();
  const updateMutation = useUpdateMyProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  // Rellenar formulario cuando se carga el perfil
  useEffect(() => {
    if (patient) {
      reset({
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone,
        birth_date: patient.birth_date ?? "",
        address: patient.address ?? "",
      });
    }
  }, [patient, reset]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    await updateMutation.mutateAsync({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      birth_date: data.birth_date || null,
      address: data.address || null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Icon name="progress_activity" size="lg" className="animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-on-surface-variant">
          No se encontró tu perfil de paciente.
        </p>
      </div>
    );
  }

  const inputClass = (hasError: boolean) =>
    `w-full pl-11 pr-4 py-3 rounded-xl border bg-surface-container-low dark:bg-slate-900/60 text-on-surface dark:text-white text-sm placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all ${
      hasError
        ? "border-error"
        : "border-outline-variant dark:border-slate-700"
    }`;

  return (
    <div className="max-w-lg">
      {/* Success message */}
      {updateMutation.isSuccess && (
        <div className="mb-6 p-3.5 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-inverse-primary text-sm flex items-center gap-2.5 border border-primary/20">
          <Icon name="check_circle" size="sm" />
          Perfil actualizado correctamente
        </div>
      )}

      {/* Error message */}
      {updateMutation.isError && (
        <div className="mb-6 p-3.5 rounded-xl bg-error-container/80 dark:bg-error-container/20 text-on-error-container dark:text-error text-sm flex items-center gap-2.5 border border-error/20">
          <Icon name="error" size="sm" />
          Error al actualizar. Intenta de nuevo.
        </div>
      )}

      {/* Info de solo lectura */}
      <div className="mb-6 p-4 rounded-xl bg-surface-container-low dark:bg-slate-900/40 border border-outline-variant/20 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-on-surface-variant">DNI</span>
            <p className="font-medium text-on-surface dark:text-white">{patient.dni}</p>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant">Email</span>
            <p className="font-medium text-on-surface dark:text-white">{patient.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
            >
              Nombre
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="person" size="sm" />
              </span>
              <input
                id="first_name"
                type="text"
                className={inputClass(!!errors.first_name)}
                {...register("first_name")}
              />
            </div>
            {errors.first_name && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1">
                <Icon name="error" size="xs" />
                {errors.first_name.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
            >
              Apellido
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="person" size="sm" />
              </span>
              <input
                id="last_name"
                type="text"
                className={inputClass(!!errors.last_name)}
                {...register("last_name")}
              />
            </div>
            {errors.last_name && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1">
                <Icon name="error" size="xs" />
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        {/* Teléfono */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
          >
            Teléfono
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="phone" size="sm" />
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              className={inputClass(!!errors.phone)}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="mt-1.5 text-xs text-error flex items-center gap-1">
              <Icon name="error" size="xs" />
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Fecha de nacimiento */}
        <div>
          <label
            htmlFor="birth_date"
            className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
          >
            Fecha de nacimiento
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="cake" size="sm" />
            </span>
            <input
              id="birth_date"
              type="date"
              className={inputClass(false)}
              {...register("birth_date")}
            />
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-on-surface dark:text-slate-300 mb-1.5"
          >
            Dirección
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="home" size="sm" />
            </span>
            <input
              id="address"
              type="text"
              placeholder="Av. Principal 123, Lima"
              className={inputClass(false)}
              {...register("address")}
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={!isDirty || isSubmitting}
          className="w-full mt-2"
        >
          {isSubmitting ? (
            <>
              <Icon name="progress_activity" size="sm" className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Icon name="save" size="sm" />
              Guardar cambios
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
