-- ============================================
-- Clinica Arca - 07: Scheduling Migration
-- auth_user_id, RLS para pacientes, funciones de disponibilidad
-- ============================================

-- -------------------------------------------------
-- 1. Agregar 'patient' al enum user_role
-- -------------------------------------------------
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'patient';

-- -------------------------------------------------
-- 2. Agregar auth_user_id a patients
-- -------------------------------------------------
ALTER TABLE patients
    ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_patients_auth_user ON patients (auth_user_id);

-- -------------------------------------------------
-- 3. Modificar handle_new_user() para crear paciente
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role  user_role;
    v_first TEXT;
    v_last  TEXT;
BEGIN
    v_role  := COALESCE(
        (NEW.raw_user_meta_data ->> 'role')::user_role,
        'receptionist'
    );
    v_first := COALESCE(NEW.raw_user_meta_data ->> 'first_name', '');
    v_last  := COALESCE(NEW.raw_user_meta_data ->> 'last_name', '');

    -- Siempre crear perfil en profiles
    INSERT INTO public.profiles (id, email, role, first_name, last_name)
    VALUES (NEW.id, NEW.email, v_role, v_first, v_last);

    -- Si es paciente, crear registro en patients automáticamente
    IF v_role = 'patient'::user_role THEN
        INSERT INTO public.patients (
            auth_user_id, dni, first_name, last_name, email, phone, status
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'dni', '00000000'),
            v_first,
            v_last,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
            'new'
        );
    END IF;

    RETURN NEW;
END;
$$;

-- -------------------------------------------------
-- 4. Helper: obtener patient_id del usuario autenticado
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_patient_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM patients WHERE auth_user_id = auth.uid();
$$;

-- -------------------------------------------------
-- 5. Helper: verificar si es paciente autenticado
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_patient()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM patients WHERE auth_user_id = auth.uid()
    );
$$;

-- -------------------------------------------------
-- 6. RLS: Pacientes ven/editan su propio registro
-- -------------------------------------------------
CREATE POLICY "Patients can view own record"
    ON patients FOR SELECT
    USING (auth_user_id = auth.uid());

CREATE POLICY "Patients can update own record"
    ON patients FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- -------------------------------------------------
-- 7. RLS: Pacientes ven/crean/cancelan sus citas
-- -------------------------------------------------
CREATE POLICY "Patients can view own appointments"
    ON appointments FOR SELECT
    USING (patient_id = my_patient_id());

CREATE POLICY "Patients can insert own appointments"
    ON appointments FOR INSERT
    WITH CHECK (patient_id = my_patient_id());

CREATE POLICY "Patients can cancel own appointments"
    ON appointments FOR UPDATE
    USING (
        patient_id = my_patient_id()
        AND status IN ('pending', 'confirmed')
        AND scheduled_date > CURRENT_DATE
    );

-- -------------------------------------------------
-- 8. RLS: Acceso público a doctors y schedules (lectura)
--    (ya existe "Public can view doctors" en 04_rls_policies.sql)
--    Solo agregar si no existe política para doctor_schedules
-- -------------------------------------------------
-- Los doctor_schedules ya tienen política pública de lectura en 04

-- -------------------------------------------------
-- 9. RLS: Pacientes pueden ver procedimientos activos
-- -------------------------------------------------
CREATE POLICY "Patients can view active procedures"
    ON procedures FOR SELECT
    USING (is_active = true);

-- -------------------------------------------------
-- 10. Función: slots disponibles de un doctor en una fecha
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_doctor_id        UUID,
    p_date             DATE,
    p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(slot_start TIME, slot_end TIME)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_day        schedule_day;
    v_schedule   RECORD;
    v_slot_start TIME;
    v_slot_end   TIME;
BEGIN
    -- Determinar día de la semana en español
    v_day := CASE EXTRACT(ISODOW FROM p_date)
        WHEN 1 THEN 'lunes'
        WHEN 2 THEN 'martes'
        WHEN 3 THEN 'miercoles'
        WHEN 4 THEN 'jueves'
        WHEN 5 THEN 'viernes'
        WHEN 6 THEN 'sabado'
        ELSE NULL  -- domingo = sin atención
    END;

    -- Domingo: no hay atención
    IF v_day IS NULL THEN
        RETURN;
    END IF;

    -- Obtener horario del doctor para ese día
    SELECT ds.start_time, ds.end_time
    INTO v_schedule
    FROM doctor_schedules ds
    WHERE ds.doctor_id = p_doctor_id
      AND ds.day_of_week = v_day
      AND ds.is_active = true;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Generar slots de p_duration_minutes minutos
    v_slot_start := v_schedule.start_time;

    WHILE v_slot_start + (p_duration_minutes || ' minutes')::INTERVAL <= v_schedule.end_time LOOP
        v_slot_end := v_slot_start + (p_duration_minutes || ' minutes')::INTERVAL;

        -- Verificar que no exista cita solapada (excluir canceladas y no-show)
        IF NOT EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.doctor_id = p_doctor_id
              AND a.scheduled_date = p_date
              AND a.status NOT IN ('cancelled', 'no_show')
              AND a.start_time < v_slot_end
              AND a.end_time > v_slot_start
        ) THEN
            slot_start := v_slot_start;
            slot_end   := v_slot_end;
            RETURN NEXT;
        END IF;

        v_slot_start := v_slot_end;
    END LOOP;
END;
$$;

-- -------------------------------------------------
-- 11. Función: validar que un slot específico esté disponible
--     (anti-race-condition, usar antes de INSERT)
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_appointment_slot(
    p_doctor_id UUID,
    p_date      DATE,
    p_start     TIME,
    p_end       TIME
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT NOT EXISTS (
        SELECT 1
        FROM appointments a
        WHERE a.doctor_id = p_doctor_id
          AND a.scheduled_date = p_date
          AND a.status NOT IN ('cancelled', 'no_show')
          AND a.start_time < p_end
          AND a.end_time > p_start
    );
$$;

-- -------------------------------------------------
-- 12. Función: contar citas futuras activas de un paciente
--     (para aplicar límite de 10)
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_patient_future_appointments(
    p_patient_id UUID
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::INTEGER
    FROM appointments
    WHERE patient_id = p_patient_id
      AND scheduled_date >= CURRENT_DATE
      AND status NOT IN ('cancelled', 'no_show', 'completed');
$$;
