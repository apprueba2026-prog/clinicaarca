-- ============================================================
-- Clinica Arca - 24: Reaplicar 18 + 22 + 23 + habilitar Realtime
--
-- Contexto: el diagnóstico v1.1 (2026-04-29) detectó que en
-- producción la migración 18 quedó parcialmente aplicada
-- (la tabla appointment_blocks existe pero la función
-- get_available_slots NO se reemplazó con el parámetro
-- p_for_admin). Las migraciones 22 y 23 tampoco corrieron.
-- Adicionalmente, la publicación supabase_realtime está vacía.
--
-- Esta migración es idempotente y deja el estado consistente.
-- ============================================================

BEGIN;

-- ----------------- get_available_slots con p_for_admin -----------------
CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_doctor_id        UUID,
    p_date             DATE,
    p_duration_minutes INTEGER DEFAULT 30,
    p_for_admin        BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(slot_start TIME, slot_end TIME)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_day        schedule_day;
    v_schedule   RECORD;
    v_slot_start TIME;
    v_slot_end   TIME;
BEGIN
    v_day := CASE EXTRACT(ISODOW FROM p_date)
        WHEN 1 THEN 'lunes' WHEN 2 THEN 'martes' WHEN 3 THEN 'miercoles'
        WHEN 4 THEN 'jueves' WHEN 5 THEN 'viernes' WHEN 6 THEN 'sabado'
        ELSE NULL END;
    IF v_day IS NULL THEN RETURN; END IF;

    SELECT ds.start_time, ds.end_time INTO v_schedule
    FROM doctor_schedules ds
    WHERE ds.doctor_id = p_doctor_id AND ds.day_of_week = v_day AND ds.is_active = true;
    IF NOT FOUND THEN RETURN; END IF;

    v_slot_start := v_schedule.start_time;
    WHILE v_slot_start + (p_duration_minutes || ' minutes')::INTERVAL <= v_schedule.end_time LOOP
        v_slot_end := v_slot_start + (p_duration_minutes || ' minutes')::INTERVAL;
        IF NOT EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.doctor_id = p_doctor_id AND a.scheduled_date = p_date
              AND a.status NOT IN ('cancelled', 'no_show')
              AND a.start_time < v_slot_end AND a.end_time > v_slot_start
        )
        AND NOT EXISTS (
            SELECT 1 FROM appointment_blocks b
            WHERE b.doctor_id = p_doctor_id AND b.block_date = p_date
              AND ((b.start_time IS NULL AND b.end_time IS NULL)
                   OR (b.start_time < v_slot_end AND b.end_time > v_slot_start))
              AND (p_for_admin = false OR b.block_type = 'unavailable')
        ) THEN
            slot_start := v_slot_start; slot_end := v_slot_end; RETURN NEXT;
        END IF;
        v_slot_start := v_slot_end;
    END LOOP;
END;
$$;

-- ----------------- validate_appointment_slot con p_for_admin -----------------
CREATE OR REPLACE FUNCTION public.validate_appointment_slot(
    p_doctor_id UUID, p_date DATE, p_start TIME, p_end TIME,
    p_for_admin BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.doctor_id = p_doctor_id AND a.scheduled_date = p_date
          AND a.status NOT IN ('cancelled', 'no_show')
          AND a.start_time < p_end AND a.end_time > p_start
    ) AND NOT EXISTS (
        SELECT 1 FROM appointment_blocks b
        WHERE b.doctor_id = p_doctor_id AND b.block_date = p_date
          AND ((b.start_time IS NULL AND b.end_time IS NULL)
               OR (b.start_time < p_end AND b.end_time > p_start))
          AND (p_for_admin = false OR b.block_type = 'unavailable')
    );
$$;

-- ----------------- Drop overloads viejos (migración 22) -----------------
DROP FUNCTION IF EXISTS public.get_available_slots(UUID, DATE, INTEGER);
DROP FUNCTION IF EXISTS public.validate_appointment_slot(UUID, DATE, TIME, TIME);

-- ----------------- Permisos (22 + 23) -----------------
REVOKE EXECUTE ON FUNCTION public.get_available_slots(UUID, DATE, INTEGER, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID, DATE, INTEGER, BOOLEAN) TO anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.validate_appointment_slot(UUID, DATE, TIME, TIME, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_appointment_slot(UUID, DATE, TIME, TIME, BOOLEAN) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.auth_role()     TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin()      TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff()      TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_patient()    TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_patient_id() TO anon, authenticated, service_role;

-- ----------------- Habilitar Realtime -----------------
-- ALTER PUBLICATION es idempotente solo si la tabla NO está. Envolvemos
-- en DO para tolerar ya-incluidas.
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE appointment_blocks;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE patients;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END$$;

COMMIT;
