import { z } from "zod";

export const guestBookingSchema = z.object({
  // Datos del guest
  guest_name: z
    .string()
    .min(2, "Nombre demasiado corto")
    .max(100, "Nombre demasiado largo"),
  guest_phone: z
    .string()
    .regex(/^9\d{8}$/, "Teléfono debe ser 9 dígitos (ej: 985289689)"),
  guest_email: z
    .string()
    .email("Email inválido"),
  guest_dni: z
    .string()
    .regex(/^\d{8}$/, "DNI debe ser 8 dígitos"),
  // Datos de la cita
  doctor_id: z.string().uuid("Doctor inválido"),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora de inicio inválida"),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora de fin inválida"),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export type GuestBookingFormData = z.infer<typeof guestBookingSchema>;
