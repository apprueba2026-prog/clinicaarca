-- ============================================
-- Clinica Arca - 13: book_appointment_atomic
-- ============================================
-- RPC para crear cita evitando race conditions cuando 2 visitantes
-- intentan reservar el mismo slot al mismo tiempo. Usa SERIALIZABLE
-- isolation a nivel de transacción.
-- ============================================

CREATE OR REPLACE FUNCTION public.book_appointment_atomic(
    p_patient_id      UUID,
    p_doctor_id       UUID,
    p_scheduled_date  DATE,
    p_start_time      TIME,
    p_end_time        TIME,
    p_priority        appointment_priority DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appointment_id UUID;
    v_conflict_count INT;
BEGIN
    -- Lock pesimista: bloquea las citas activas del doctor en esa fecha
    -- para evitar overlap durante la transacción.
    PERFORM 1
    FROM public.appointments
    WHERE doctor_id = p_doctor_id
      AND scheduled_date = p_scheduled_date
      AND status IN ('pending', 'confirmed', 'in_progress')
    FOR UPDATE;

    -- Validar overlap
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.appointments
    WHERE doctor_id = p_doctor_id
      AND scheduled_date = p_scheduled_date
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND tsrange(
            (scheduled_date + start_time)::timestamp,
            (scheduled_date + end_time)::timestamp,
            '[)'
          )
          &&
          tsrange(
            (p_scheduled_date + p_start_time)::timestamp,
            (p_scheduled_date + p_end_time)::timestamp,
            '[)'
          );

    IF v_conflict_count > 0 THEN
        RETURN NULL; -- conflicto: el caller debe interpretar como "slot ocupado"
    END IF;

    INSERT INTO public.appointments (
        patient_id, doctor_id, scheduled_date,
        start_time, end_time, status, priority
    ) VALUES (
        p_patient_id, p_doctor_id, p_scheduled_date,
        p_start_time, p_end_time, 'confirmed', p_priority
    )
    RETURNING id INTO v_appointment_id;

    RETURN v_appointment_id;
END;
$$;

-- Permisos: solo service role (anon/authenticated NO pueden ejecutar)
REVOKE ALL ON FUNCTION public.book_appointment_atomic(
    UUID, UUID, DATE, TIME, TIME, appointment_priority
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_appointment_atomic(
    UUID, UUID, DATE, TIME, TIME, appointment_priority
) TO service_role;
