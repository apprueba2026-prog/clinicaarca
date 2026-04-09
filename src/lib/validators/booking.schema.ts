import { z } from "zod";

export const bookingSchema = z.object({
  doctor_id: z.string().uuid("Doctor inválido"),
  procedure_id: z.string().uuid().nullable().optional(),
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

export type BookingFormData = z.infer<typeof bookingSchema>;
