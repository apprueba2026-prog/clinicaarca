import { z } from "zod";

export const patientSchema = z
  .object({
    document_type: z.enum(["dni", "passport"]),
    dni: z.string().min(6, "Documento muy corto").max(15, "Documento muy largo"),
    first_name: z.string().min(2, "El nombre es obligatorio"),
    last_name: z.string().min(2, "El apellido es obligatorio"),
    email: z
      .string()
      .min(1, "El correo es obligatorio")
      .email("Correo inválido"),
    phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
    birth_date: z.string().optional(),
    address: z.string().optional(),
    insurance_partner_id: z.string().uuid().optional().nullable(),
    insurance_policy_number: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.document_type === "dni" && !/^\d{8}$/.test(val.dni)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dni"],
        message: "El DNI debe tener exactamente 8 dígitos",
      });
    }
    if (
      val.document_type === "passport" &&
      !/^[A-Za-z0-9]{6,15}$/.test(val.dni)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dni"],
        message: "El pasaporte debe tener 6-15 caracteres alfanuméricos",
      });
    }
  });

export type PatientFormData = z.infer<typeof patientSchema>;
