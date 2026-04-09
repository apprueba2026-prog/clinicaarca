import type { ProcedureCategory, ScheduleDay } from "./enums";

export interface Doctor {
  id: string;
  profile_id: string;
  specialties: ProcedureCategory[];
  license_number: string | null;
  bio: string | null;
  consultation_duration_minutes: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorWithProfile extends Doctor {
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: ScheduleDay;
  start_time: string;
  end_time: string;
  is_active: boolean;
}
