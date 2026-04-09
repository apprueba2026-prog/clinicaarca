import { z } from "zod";

export const updateProfileSchema = z.object({
  first_name: z.string().min(2, "El nombre es obligatorio"),
  last_name: z.string().min(2, "El apellido es obligatorio"),
  phone: z
    .string()
    .min(9, "El teléfono debe tener al menos 9 dígitos")
    .regex(/^\d+$/, "Solo números"),
  birth_date: z.string().nullable().optional(),
  address: z.string().max(200, "Máximo 200 caracteres").nullable().optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export const cancelAppointmentSchema = z.object({
  appointment_id: z.string().uuid("ID de cita inválido"),
});

export type CancelAppointmentData = z.infer<typeof cancelAppointmentSchema>;
