import { z } from "zod";

export const patientSchema = z.object({
  dni: z
    .string()
    .length(8, "El DNI debe tener 8 dígitos")
    .regex(/^\d+$/, "El DNI solo debe contener números"),
  first_name: z.string().min(2, "El nombre es obligatorio"),
  last_name: z.string().min(2, "El apellido es obligatorio"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  insurance_partner_id: z.string().uuid().optional().nullable(),
  insurance_policy_number: z.string().optional(),
  notes: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;
