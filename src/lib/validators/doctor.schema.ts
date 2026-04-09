import { z } from "zod";

const specialtyEnum = z.enum([
  "general",
  "odontopediatria",
  "implantes",
  "ortodoncia",
  "sedacion",
  "cirugia",
  "estetica",
  "endodoncia",
  "periodoncia",
]);

export const createDoctorSchema = z.object({
  first_name: z.string().min(2, "El nombre es obligatorio"),
  last_name: z.string().min(2, "El apellido es obligatorio"),
  email: z.string().email("Ingresa un correo válido"),
  specialties: z
    .array(specialtyEnum)
    .min(1, "Selecciona al menos una especialidad")
    .max(3, "Máximo 3 especialidades"),
  license_number: z.string().min(4, "Número de colegiatura obligatorio"),
  bio: z.string().max(500, "Máximo 500 caracteres").optional(),
  consultation_duration_minutes: z.number().min(15).max(120).optional(),
  is_public: z.boolean().optional(),
});

export type CreateDoctorFormData = z.infer<typeof createDoctorSchema>;

export const updateDoctorSchema = z.object({
  first_name: z.string().min(2, "El nombre es obligatorio").optional(),
  last_name: z.string().min(2, "El apellido es obligatorio").optional(),
  specialties: z
    .array(specialtyEnum)
    .min(1, "Selecciona al menos una especialidad")
    .max(3, "Máximo 3 especialidades")
    .optional(),
  license_number: z.string().min(4).optional(),
  bio: z.string().max(500).optional(),
  consultation_duration_minutes: z.number().min(15).max(120).optional(),
  is_public: z.boolean().optional(),
});

export type UpdateDoctorFormData = z.infer<typeof updateDoctorSchema>;
