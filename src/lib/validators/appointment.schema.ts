import { z } from "zod";

export const appointmentSchema = z.object({
  patient_id: z.string().uuid("Seleccione un paciente"),
  doctor_id: z.string().uuid("Seleccione un doctor"),
  procedure_id: z.string().uuid().optional().nullable(),
  scheduled_date: z.string().min(1, "La fecha es obligatoria"),
  start_time: z.string().min(1, "La hora de inicio es obligatoria"),
  end_time: z.string().min(1, "La hora de fin es obligatoria"),
  priority: z.enum(["normal", "urgent", "emergency"]),
  notes: z.string().optional(),
  room: z.string().optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
