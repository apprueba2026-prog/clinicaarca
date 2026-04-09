import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const signupSchema = z.object({
  full_name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirm_password: z.string().min(6, "Mínimo 6 caracteres"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirm_password: z.string().min(6, "Mínimo 6 caracteres"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

export const patientSignupSchema = z.object({
  first_name: z.string().min(2, "El nombre es obligatorio"),
  last_name: z.string().min(2, "El apellido es obligatorio"),
  dni: z
    .string()
    .length(8, "El DNI debe tener 8 dígitos")
    .regex(/^\d+$/, "Solo números"),
  phone: z
    .string()
    .min(9, "El teléfono debe tener al menos 9 dígitos")
    .regex(/^\d+$/, "Solo números"),
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirm_password: z.string().min(6, "Mínimo 6 caracteres"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type PatientSignupFormData = z.infer<typeof patientSignupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
