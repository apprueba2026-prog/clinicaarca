import { z } from "zod";

export const invoiceSchema = z
  .object({
    patient_id: z.string().uuid("Seleccione un paciente"),
    appointment_id: z.string().uuid().optional().nullable(),
    invoice_type: z.enum(["boleta", "factura"]),
    ruc: z.string().optional(),
    business_name: z.string().optional(),
    subtotal: z.number().min(0, "El monto no puede ser negativo"),
    concept: z.string().min(1, "Ingrese el concepto"),
  })
  .refine(
    (data) => {
      if (data.invoice_type === "factura") {
        return data.ruc && data.ruc.length === 11;
      }
      return true;
    },
    {
      message: "El RUC debe tener 11 dígitos para facturas",
      path: ["ruc"],
    }
  );

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
