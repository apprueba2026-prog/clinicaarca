import { createClient } from "@/lib/supabase/client";
import type { DoctorWithProfile, DoctorSchedule } from "@/lib/types/doctor";
import type { ProcedureCategory } from "@/lib/types/enums";

const DOCTOR_WITH_PROFILE =
  `id, specialties, license_number, bio, consultation_duration_minutes, is_public, created_at, updated_at,
  profile:profiles(first_name, last_name, email, avatar_url)`;

const SCHEDULE_COLUMNS =
  "id, doctor_id, day_of_week, start_time, end_time, is_active";

export interface CreateDoctorData {
  first_name: string;
  last_name: string;
  email: string;
  specialties: ProcedureCategory[];
  license_number: string;
  bio?: string;
  consultation_duration_minutes?: number;
  is_public?: boolean;
}

export interface UpdateDoctorData {
  first_name?: string;
  last_name?: string;
  specialties?: ProcedureCategory[];
  license_number?: string;
  bio?: string;
  consultation_duration_minutes?: number;
  is_public?: boolean;
}

export interface UpsertScheduleData {
  doctor_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export const adminDoctorsService = {
  /** Obtener todos los doctores (admin, incluye no públicos) */
  async getAll(): Promise<DoctorWithProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("doctors")
      .select(DOCTOR_WITH_PROFILE)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data as unknown as DoctorWithProfile[]) ?? [];
  },

  /** Obtener un doctor por ID */
  async getById(id: string): Promise<DoctorWithProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("doctors")
      .select(DOCTOR_WITH_PROFILE)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as unknown as DoctorWithProfile;
  },

  /** Crear doctor: primero crea profile con role='dentist', luego doctor */
  async create(input: CreateDoctorData): Promise<DoctorWithProfile> {
    const supabase = createClient();

    // 1. Crear profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        email: input.email,
        role: "dentist",
        first_name: input.first_name,
        last_name: input.last_name,
      })
      .select("id")
      .single();

    if (profileError) throw profileError;

    // 2. Crear doctor vinculado al profile
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .insert({
        id: profile.id,
        profile_id: profile.id,
        specialties: input.specialties,
        license_number: input.license_number,
        bio: input.bio ?? null,
        consultation_duration_minutes: input.consultation_duration_minutes ?? 30,
        is_public: input.is_public ?? true,
      })
      .select(DOCTOR_WITH_PROFILE)
      .single();

    if (doctorError) throw doctorError;
    return doctor as unknown as DoctorWithProfile;
  },

  /** Actualizar datos del doctor (y opcionalmente su perfil) */
  async update(id: string, data: UpdateDoctorData): Promise<void> {
    const supabase = createClient();

    // Separar campos de perfil vs doctor
    const { first_name, last_name, ...doctorFields } = data;
    const hasProfileChanges = first_name !== undefined || last_name !== undefined;

    // Actualizar perfil si hay cambios
    if (hasProfileChanges) {
      const profileUpdate: Record<string, string> = {};
      if (first_name) profileUpdate.first_name = first_name;
      if (last_name) profileUpdate.last_name = last_name;

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", id); // profile_id === doctor.id en este schema

      if (profileError) throw profileError;
    }

    // Actualizar campos del doctor
    if (Object.keys(doctorFields).length > 0) {
      const { error } = await supabase
        .from("doctors")
        .update(doctorFields)
        .eq("id", id);

      if (error) throw error;
    }
  },

  /** Toggle visibilidad pública */
  async togglePublic(id: string, isPublic: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("doctors")
      .update({ is_public: isPublic })
      .eq("id", id);

    if (error) throw error;
  },

  /** Obtener horarios de un doctor */
  async getSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("doctor_schedules")
      .select(SCHEDULE_COLUMNS)
      .eq("doctor_id", doctorId)
      .order("day_of_week");

    if (error) throw error;
    return (data as DoctorSchedule[]) ?? [];
  },

  /** Guardar horarios (upsert por doctor_id + day_of_week) */
  async upsertSchedules(schedules: UpsertScheduleData[]): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("doctor_schedules")
      .upsert(schedules, { onConflict: "doctor_id,day_of_week" });

    if (error) throw error;
  },
};
