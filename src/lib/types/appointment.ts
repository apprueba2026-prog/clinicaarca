import type { AppointmentStatus, AppointmentPriority } from "./enums";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  procedure_id: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  notes: string | null;
  room: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Appointment con datos relacionados (joins) */
export interface AppointmentWithDetails extends Appointment {
  patient: {
    first_name: string;
    last_name: string;
    dni: string;
    phone: string;
  };
  doctor: {
    profile: {
      first_name: string;
      last_name: string;
    };
    specialty: string;
  };
  procedure: {
    name: string;
    category: string;
  } | null;
}
