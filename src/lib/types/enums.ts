export type UserRole = "admin" | "dentist" | "receptionist" | "patient";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type PatientStatus = "active" | "inactive" | "new";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "partial"
  | "overdue"
  | "refunded";

export type InvoiceType = "boleta" | "factura";

export type ProcedureCategory =
  | "general"
  | "odontopediatria"
  | "implantes"
  | "ortodoncia"
  | "sedacion"
  | "cirugia"
  | "estetica"
  | "endodoncia"
  | "periodoncia";

export type ContentStatus = "draft" | "published" | "archived";

export type NewsCategory = "innovation" | "award" | "promotion" | "event";

export type ScheduleDay =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado";

export type AppointmentPriority = "normal" | "urgent" | "emergency";

export type InsuranceStatus = "active" | "inactive";
