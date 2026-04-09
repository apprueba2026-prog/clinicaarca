"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useCreateDoctor, useUpdateDoctor } from "@/hooks/use-admin-doctors";
import {
  createDoctorSchema,
  type CreateDoctorFormData,
} from "@/lib/validators/doctor.schema";
import { cn } from "@/lib/utils/cn";
import type { DoctorWithProfile } from "@/lib/types/doctor";
import type { ProcedureCategory } from "@/lib/types/enums";

const SPECIALTY_OPTIONS: { value: ProcedureCategory; label: string }[] = [
  { value: "general", label: "Odontología General" },
  { value: "implantes", label: "Implantes Dentales" },
  { value: "odontopediatria", label: "Odontopediatría" },
  { value: "ortodoncia", label: "Ortodoncia" },
  { value: "sedacion", label: "Sedación Dental" },
  { value: "cirugia", label: "Cirugía Oral" },
  { value: "estetica", label: "Estética Dental" },
  { value: "endodoncia", label: "Endodoncia" },
  { value: "periodoncia", label: "Periodoncia" },
];

interface DoctorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor?: DoctorWithProfile;
}

export function DoctorFormModal({ isOpen, onClose, doctor }: DoctorFormModalProps) {
  const isEditMode = !!doctor;
  const createMutation = useCreateDoctor();
  const updateMutation = useUpdateDoctor();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateDoctorFormData>({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      specialties: [],
      license_number: "",
      bio: "",
      consultation_duration_minutes: 30,
      is_public: true,
    },
  });

  // Poblar formulario en modo edición
  useEffect(() => {
    if (doctor) {
      reset({
        first_name: doctor.profile.first_name,
        last_name: doctor.profile.last_name,
        email: doctor.profile.email,
        specialties: doctor.specialties,
        license_number: doctor.license_number ?? "",
        bio: doctor.bio ?? "",
        consultation_duration_minutes: doctor.consultation_duration_minutes,
        is_public: doctor.is_public,
      });
    } else {
      reset({
        first_name: "",
        last_name: "",
        email: "",
        specialties: [],
        license_number: "",
        bio: "",
        consultation_duration_minutes: 30,
        is_public: true,
      });
    }
  }, [doctor, reset]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const onSubmit = async (data: CreateDoctorFormData) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: doctor.id,
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            specialties: data.specialties,
            license_number: data.license_number,
            bio: data.bio,
            consultation_duration_minutes: data.consultation_duration_minutes,
            is_public: data.is_public,
          },
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      reset();
      onClose();
    } catch {
      // Error manejado por TanStack Query
    }
  };

  if (!isOpen) return null;

  const mutation = isEditMode ? updateMutation : createMutation;

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border bg-surface-container-lowest text-on-surface text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all ${
      hasError ? "border-error" : "border-outline-variant"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <h2 className="text-lg font-headline font-bold text-on-surface">
            {isEditMode ? "Editar Doctor" : "Nuevo Doctor"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container-high rounded-full cursor-pointer"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Error */}
        {mutation.isError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-error-container/80 text-on-error-container text-sm flex items-center gap-2 border border-error/20">
            <Icon name="error" size="sm" />
            {isEditMode
              ? "Error al actualizar el doctor. Inténtalo de nuevo."
              : "Error al crear el doctor. Verifica que el email y colegiatura no estén duplicados."}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Nombre
              </label>
              <input
                type="text"
                placeholder="Sonia"
                className={inputClass(!!errors.first_name)}
                {...register("first_name")}
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-error">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Apellido
              </label>
              <input
                type="text"
                placeholder="Arca"
                className={inputClass(!!errors.last_name)}
                {...register("last_name")}
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-error">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="doctor@clinicaarca.com"
              className={cn(inputClass(!!errors.email), isEditMode && "opacity-60 cursor-not-allowed")}
              readOnly={isEditMode}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-error">{errors.email.message}</p>
            )}
          </div>

          {/* Especialidades (multi-select chips) */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-2">
              Especialidades <span className="text-on-surface-variant/60">(máx. 3)</span>
            </label>
            <Controller
              name="specialties"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {SPECIALTY_OPTIONS.map((opt) => {
                    const isSelected = field.value?.includes(opt.value);
                    const isMaxReached = (field.value?.length ?? 0) >= 3 && !isSelected;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isMaxReached}
                        onClick={() => {
                          if (isSelected) {
                            field.onChange(field.value.filter((v: string) => v !== opt.value));
                          } else {
                            field.onChange([...field.value, opt.value]);
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary text-on-primary border-primary"
                            : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary/50",
                          isMaxReached && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.specialties && (
              <p className="mt-1 text-xs text-error">{errors.specialties.message}</p>
            )}
          </div>

          {/* Colegiatura y Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                N° Colegiatura
              </label>
              <input
                type="text"
                placeholder="COP-12345"
                className={inputClass(!!errors.license_number)}
                {...register("license_number")}
              />
              {errors.license_number && (
                <p className="mt-1 text-xs text-error">
                  {errors.license_number.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Duración consulta (min)
              </label>
              <input
                type="number"
                min={15}
                max={120}
                className={inputClass(!!errors.consultation_duration_minutes)}
                {...register("consultation_duration_minutes", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">
              Biografía (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Especialista en..."
              className={inputClass(!!errors.bio) + " resize-none"}
              {...register("bio")}
            />
          </div>

          {/* Visible públicamente */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              {...register("is_public")}
            />
            <span className="text-sm text-on-surface">
              Visible en la web pública
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon name="progress_activity" size="sm" className="animate-spin" />
                  {isEditMode ? "Guardando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Icon name={isEditMode ? "save" : "person_add"} size="sm" />
                  {isEditMode ? "Guardar Cambios" : "Crear Doctor"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
