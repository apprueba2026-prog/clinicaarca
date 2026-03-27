"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/stores/modal.store";
import { invoiceSchema, type InvoiceFormData } from "@/lib/validators/invoice.schema";
import { invoicesService } from "@/lib/services/invoices.service";
import { proceduresService } from "@/lib/services/procedures.service";
import { cn } from "@/lib/utils/cn";

export function InvoiceModal() {
  const { activeModal, modalData, closeModal } = useModalStore();
  const isOpen = activeModal === "new-invoice";
  const queryClient = useQueryClient();

  const patientId = (modalData?.patientId as string) ?? "";
  const patientName = (modalData?.patientName as string) ?? "";
  const patientDni = (modalData?.patientDni as string) ?? "";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patient_id: patientId,
      invoice_type: "boleta",
      subtotal: 0,
      concept: "",
    },
  });

  const selectedType = watch("invoice_type") ?? "boleta";

  const { data: procedures } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => proceduresService.getActive(),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: InvoiceFormData) =>
      invoicesService.create({
        patient_id: data.patient_id,
        appointment_id: data.appointment_id ?? null,
        invoice_type: data.invoice_type,
        ruc: data.ruc ?? null,
        business_name: data.business_name ?? null,
        subtotal: data.subtotal,
        concept: data.concept,
        payment_status: "pending",
        created_by: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      reset();
      closeModal();
    },
  });

  // Sync patientId when modal opens
  useEffect(() => {
    if (isOpen && patientId) {
      setValue("patient_id", patientId);
      setValue("invoice_type", "boleta");
    }
    if (!isOpen) reset();
  }, [isOpen, patientId, setValue, reset]);

  function handleTypeChange(type: "boleta" | "factura") {
    setValue("invoice_type", type);
  }

  function handleProcedureSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const proc = procedures?.find((p) => p.id === e.target.value);
    if (proc) {
      setValue("subtotal", proc.base_price);
      setValue("concept", proc.name);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={closeModal}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">
              Emitir Comprobante
            </h3>
            <p className="text-slate-500 text-sm">
              Envío directo a SUNAT y WhatsApp del paciente.
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="p-8 space-y-6"
        >
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleTypeChange("boleta")}
              className={cn(
                "p-4 border-2 rounded-2xl transition-all cursor-pointer",
                selectedType === "boleta"
                  ? "border-primary bg-sky-50 dark:bg-sky-900/20"
                  : "border-slate-100 dark:border-slate-800"
              )}
            >
              <p
                className={cn(
                  "text-center font-bold",
                  selectedType === "boleta"
                    ? "text-sky-700 dark:text-sky-400"
                    : "text-slate-500"
                )}
              >
                Boleta de Venta
              </p>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("factura")}
              className={cn(
                "p-4 border-2 rounded-2xl transition-all cursor-pointer",
                selectedType === "factura"
                  ? "border-primary bg-sky-50 dark:bg-sky-900/20"
                  : "border-slate-100 dark:border-slate-800"
              )}
            >
              <p
                className={cn(
                  "text-center font-bold",
                  selectedType === "factura"
                    ? "text-sky-700 dark:text-sky-400"
                    : "text-slate-500"
                )}
              >
                Factura RUC
              </p>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* DNI / RUC */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                {selectedType === "factura" ? "RUC" : "DNI"}
              </label>
              {selectedType === "factura" ? (
                <>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20"
                    placeholder="RUC 11 dígitos"
                    {...register("ruc")}
                  />
                  {errors.ruc && (
                    <p className="text-xs text-error">{errors.ruc.message}</p>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20"
                  value={patientDni}
                  readOnly
                />
              )}
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Monto (S/)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-extrabold focus:ring-2 focus:ring-sky-500/20"
                {...register("subtotal", { valueAsNumber: true })}
              />
              {errors.subtotal && (
                <p className="text-xs text-error">
                  {errors.subtotal.message}
                </p>
              )}
            </div>
          </div>

          {/* Nombre / Razón Social */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">
              {selectedType === "factura" ? "Razón Social" : "Nombre"}
            </label>
            {selectedType === "factura" ? (
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20"
                placeholder="Razón social..."
                {...register("business_name")}
              />
            ) : (
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20"
                value={patientName}
                readOnly
              />
            )}
          </div>

          {/* Procedimiento / Concepto */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">
              Procedimiento / Concepto
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
                onChange={handleProcedureSelect}
                defaultValue=""
              >
                <option value="">Seleccionar procedimiento...</option>
                {procedures?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              />
            </div>
            <input type="hidden" {...register("concept")} />
            {errors.concept && (
              <p className="text-xs text-error">{errors.concept.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-4 rounded-2xl"
            size="lg"
          >
            {createMutation.isPending ? (
              <>
                <Icon
                  name="progress_activity"
                  size="sm"
                  className="animate-spin"
                />
                Procesando...
              </>
            ) : (
              <>
                <Icon name="send" size="sm" />
                Emitir a SUNAT y Enviar por WhatsApp
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
