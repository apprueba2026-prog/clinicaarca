import { z } from "zod";

export const appointmentSchema = z
  .object({
    patient_id: z.string().uuid("Seleccione un paciente"),
    doctor_id: z.string().uuid("Seleccione un doctor"),
    procedure_id: z.string().optional().nullable(),
    custom_procedure: z.string().optional().nullable(),
    procedure_description: z.string().optional().nullable(),
    scheduled_date: z.string().min(1, "La fecha es obligatoria"),
    start_time: z.string().min(1, "La hora de inicio es obligatoria"),
    end_time: z.string().min(1, "La hora de fin es obligatoria"),
    priority: z.enum(["normal", "urgent", "emergency"]),
    notes: z.string().optional(),
    room: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.procedure_id && val.procedure_id !== "") {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val.procedure_id
        );
      if (!isUuid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Procedimiento inválido",
          path: ["procedure_id"],
        });
      }
    }
    if (val.custom_procedure && val.custom_procedure.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El nombre del procedimiento es muy corto",
        path: ["custom_procedure"],
      });
    }
  });

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
