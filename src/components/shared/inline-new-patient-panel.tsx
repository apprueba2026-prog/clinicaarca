"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@/components/ui/icon";
import {
  patientSchema,
  type PatientFormData,
} from "@/lib/validators/patient.schema";
import type { Patient } from "@/lib/types/patient";

interface Props {
  onCreated: (patient: Patient) => void;
  onCancel: () => void;
}

export function InlineNewPatientPanel({ onCreated, onCancel }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { document_type: "dni" },
  });

  const docType = watch("document_type");

  async function onSubmit(data: PatientFormData) {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/patients/admin-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Error al registrar paciente");
      }
      onCreated(json.patient as Patient);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-3 p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
          Registrar nuevo paciente
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label="Cancelar"
        >
          <Icon name="close" size="sm" />
        </button>
      </div>

      <div
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
            handleSubmit(onSubmit)();
          }
        }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Tipo doc.
          </label>
          <select
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
            {...register("document_type")}
          >
            <option value="dni">DNI</option>
            <option value="passport">Pasaporte</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            {docType === "passport" ? "Pasaporte" : "DNI"}
          </label>
          <input
            type="text"
            placeholder={docType === "passport" ? "AB123456" : "12345678"}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
            {...register("dni")}
          />
          {errors.dni && (
            <p className="text-[10px] text-error">{errors.dni.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Nombre
          </label>
          <input
            type="text"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
            {...register("first_name")}
          />
          {errors.first_name && (
            <p className="text-[10px] text-error">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Apellido
          </label>
          <input
            type="text"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
            {...register("last_name")}
          />
          {errors.last_name && (
            <p className="text-[10px] text-error">{errors.last_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Teléfono
          </label>
          <input
            type="tel"
            placeholder="9XXXXXXXX"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-[10px] text-error">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Correo electrónico <span className="text-error">*</span>
          </label>
          <input
            type="email"
            placeholder="paciente@correo.com"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-[10px] text-error">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Fecha nacimiento
          </label>
          <input
            type="date"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
            {...register("birth_date")}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Dirección
          </label>
          <input
            type="text"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
            {...register("address")}
          />
        </div>

        <div className="space-y-1 col-span-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Notas (opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Alergias, condiciones, etc."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs resize-none"
            {...register("notes")}
          />
        </div>
      </div>

      {submitError && (
        <div className="p-2 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-[11px] text-error font-medium">{submitError}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="px-4 py-1.5 text-[11px] font-bold bg-primary text-on-primary rounded-lg cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
        >
          {isSubmitting ? (
            <>
              <Icon name="progress_activity" size="sm" className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Icon name="check" size="sm" />
              Guardar paciente
            </>
          )}
        </button>
      </div>
    </div>
  );
}
