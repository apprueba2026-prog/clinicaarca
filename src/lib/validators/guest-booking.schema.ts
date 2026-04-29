import { z } from "zod";

export const guestBookingSchema = z
  .object({
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
    guest_dni: z.string(),
    guest_document_type: z
      .enum(["dni", "passport"])
      .default("dni"),
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
  })
  .refine(
    (data) => {
      if (data.guest_document_type === "passport") {
        // Pasaporte: alfanumérico, 6-15 caracteres
        return /^[A-Za-z0-9]{6,15}$/.test(data.guest_dni);
      }
      // DNI: 8 dígitos numéricos
      return /^\d{8}$/.test(data.guest_dni);
    },
    {
      message: "Documento de identidad inválido",
      path: ["guest_dni"],
    }
  );

export type GuestBookingFormData = z.infer<typeof guestBookingSchema>;
