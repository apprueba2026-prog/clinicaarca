import { z } from "zod";

export const appointmentBlockSchema = z
  .object({
    doctor_id: z.string().uuid("Seleccione un doctor"),
    block_type: z.enum(["fixed_patients", "unavailable"]),
    block_date: z.string().min(1, "La fecha es obligatoria"),
    start_time: z.string().nullable().optional(),
    end_time: z.string().nullable().optional(),
    title: z.string().max(120).nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    const start = val.start_time && val.start_time !== "" ? val.start_time : null;
    const end = val.end_time && val.end_time !== "" ? val.end_time : null;
    const bothNull = !start && !end;
    const bothSet = start && end;
    if (!bothNull && !bothSet) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indique ambas horas o ninguna (día completo)",
        path: ["end_time"],
      });
      return;
    }
    if (bothSet && start! >= end!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La hora de fin debe ser posterior a la de inicio",
        path: ["end_time"],
      });
    }
  });

export type AppointmentBlockFormData = z.infer<typeof appointmentBlockSchema>;
