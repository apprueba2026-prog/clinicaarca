import type { ProcedureCategory, ScheduleDay } from "./enums";

/** Slot de tiempo disponible retornado por get_available_slots() */
export interface TimeSlot {
  slot_start: string; // 'HH:MM:SS'
  slot_end: string;   // 'HH:MM:SS'
}

/** Doctor público con perfil y horarios para el wizard de agendamiento */
export interface PublicDoctor {
  id: string;
  specialties: ProcedureCategory[];
  bio: string | null;
  consultation_duration_minutes: number;
  profile: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  schedules: {
    day_of_week: ScheduleDay;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }[];
}

/** Procedimiento agrupado por categoría */
export interface ProcedureOption {
  id: string;
  name: string;
  category: ProcedureCategory;
  base_price: number;
  estimated_duration_minutes: number;
}

/** Categoría de servicio para el wizard */
export interface ServiceCategory {
  category: ProcedureCategory;
  label: string;
  icon: string;
  description: string;
}

/** Resumen de la reserva antes de confirmar */
export interface BookingSummary {
  doctor: PublicDoctor;
  procedure: ProcedureOption | null;
  category: ProcedureCategory;
  date: string;
  slot: TimeSlot;
  notes: string;
}
