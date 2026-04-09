import { createClient } from "@/lib/supabase/client";
import type { TimeSlot, PublicDoctor } from "@/lib/types/scheduling";
import type { ProcedureCategory } from "@/lib/types/enums";

export const schedulingService = {
  /** Obtener slots disponibles de un doctor en una fecha */
  async getAvailableSlots(
    doctorId: string,
    date: string,
    durationMinutes = 30
  ): Promise<TimeSlot[]> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_available_slots", {
      p_doctor_id: doctorId,
      p_date: date,
      p_duration_minutes: durationMinutes,
    });

    if (error) throw error;
    return (data as TimeSlot[]) ?? [];
  },

  /** Validar que un slot específico sigue disponible */
  async validateSlot(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("validate_appointment_slot", {
      p_doctor_id: doctorId,
      p_date: date,
      p_start: startTime,
      p_end: endTime,
    });

    if (error) throw error;
    return data as boolean;
  },

  /** Obtener todos los doctores públicos con perfil y horarios */
  async getPublicDoctors(): Promise<PublicDoctor[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("doctors")
      .select(
        `id, specialties, bio, consultation_duration_minutes,
        profile:profiles(first_name, last_name, avatar_url),
        schedules:doctor_schedules(day_of_week, start_time, end_time, is_active)`
      )
      .eq("is_public", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    const doctors = (data as unknown as PublicDoctor[]) ?? [];
    return doctors.filter((d) => d.profile !== null);
  },

  /** Obtener doctores que cubren una especialidad */
  async getDoctorsByCategory(
    category: ProcedureCategory
  ): Promise<PublicDoctor[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("doctors")
      .select(
        `id, specialties, bio, consultation_duration_minutes,
        profile:profiles(first_name, last_name, avatar_url),
        schedules:doctor_schedules(day_of_week, start_time, end_time, is_active)`
      )
      .eq("is_public", true)
      .contains("specialties", [category])
      .order("created_at", { ascending: true });

    if (error) throw error;
    const doctors = (data as unknown as PublicDoctor[]) ?? [];
    return doctors.filter((d) => d.profile !== null);
  },
};
