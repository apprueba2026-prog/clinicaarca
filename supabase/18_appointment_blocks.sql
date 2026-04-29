-- ============================================
-- Clinica Arca - 18: Appointment Blocks (Pre-reservas)
-- Capa de bloqueos de horarios:
--   - 'fixed_patients': reservado para clientes fijos.
--       El público no ve el slot disponible; el admin sí
--       puede agendar citas individuales DENTRO del bloque.
--   - 'unavailable': bloqueado totalmente (vacaciones,
--       viaje, urgencia). Ni público ni admin pueden agendar.
--
-- Compatibilidad: las funciones get_available_slots y
-- validate_appointment_slot reciben un parámetro nuevo
-- p_for_admin (default FALSE) para preservar la firma
-- usada por el flujo público.
-- ============================================

-- -------------------------------------------------
-- 1. Enum block_type
-- -------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'block_type') THEN
        CREATE TYPE block_type AS ENUM ('fixed_patients', 'unavailable');
    END IF;
END$$;

-- -------------------------------------------------
-- 2. Tabla appointment_blocks
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS appointment_blocks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id   UUID NOT NULL REFERENCES doctors ON DELETE CASCADE,
    block_type  block_type NOT NULL,
    block_date  DATE NOT NULL,
    start_time  TIME,
    end_time    TIME,
    title       TEXT,
    notes       TEXT,
    created_by  UUID REFERENCES profiles ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT appointment_blocks_time_range CHECK (
        (start_time IS NULL AND end_time IS NULL)
        OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    )
);

CREATE INDEX IF NOT EXISTS idx_appointment_blocks_doctor_date
    ON appointment_blocks (doctor_id, block_date);
CREATE INDEX IF NOT EXISTS idx_appointment_blocks_date
    ON appointment_blocks (block_date);

DROP TRIGGER IF EXISTS trg_appointment_blocks_updated_at ON appointment_blocks;
CREATE TRIGGER trg_appointment_blocks_updated_at
    BEFORE UPDATE ON appointment_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------
-- 3. RLS
--    - Lectura pública (las funciones de disponibilidad
--      la consultan sin sesión autenticada).
--    - Escritura solo staff.
-- -------------------------------------------------
ALTER TABLE appointment_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view appointment blocks" ON appointment_blocks;
CREATE POLICY "Public can view appointment blocks"
    ON appointment_blocks FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Staff can insert appointment blocks" ON appointment_blocks;
CREATE POLICY "Staff can insert appointment blocks"
    ON appointment_blocks FOR INSERT
    WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff can update appointment blocks" ON appointment_blocks;
CREATE POLICY "Staff can update appointment blocks"
    ON appointment_blocks FOR UPDATE
    USING (is_staff())
    WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff can delete appointment blocks" ON appointment_blocks;
CREATE POLICY "Staff can delete appointment blocks"
    ON appointment_blocks FOR DELETE
    USING (is_staff());

-- -------------------------------------------------
-- 4. get_available_slots() — soporta bloques
--    p_for_admin = false  → ocultar slots solapados con
--                           cualquier bloque activo.
--    p_for_admin = true   → ocultar solo bloques tipo
--                           'unavailable'; los 'fixed_patients'
--                           se mantienen visibles para que la
--                           admin pueda agendar dentro.
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_doctor_id        UUID,
    p_date             DATE,
    p_duration_minutes INTEGER DEFAULT 30,
    p_for_admin        BOOLEAN DEFAULT FALSE
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
    v_day := CASE EXTRACT(ISODOW FROM p_date)
        WHEN 1 THEN 'lunes'
        WHEN 2 THEN 'martes'
        WHEN 3 THEN 'miercoles'
        WHEN 4 THEN 'jueves'
        WHEN 5 THEN 'viernes'
        WHEN 6 THEN 'sabado'
        ELSE NULL
    END;

    IF v_day IS NULL THEN
        RETURN;
    END IF;

    SELECT ds.start_time, ds.end_time
    INTO v_schedule
    FROM doctor_schedules ds
    WHERE ds.doctor_id = p_doctor_id
      AND ds.day_of_week = v_day
      AND ds.is_active = true;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    v_slot_start := v_schedule.start_time;

    WHILE v_slot_start + (p_duration_minutes || ' minutes')::INTERVAL <= v_schedule.end_time LOOP
        v_slot_end := v_slot_start + (p_duration_minutes || ' minutes')::INTERVAL;

        IF NOT EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.doctor_id = p_doctor_id
              AND a.scheduled_date = p_date
              AND a.status NOT IN ('cancelled', 'no_show')
              AND a.start_time < v_slot_end
              AND a.end_time > v_slot_start
        )
        AND NOT EXISTS (
            SELECT 1
            FROM appointment_blocks b
            WHERE b.doctor_id = p_doctor_id
              AND b.block_date = p_date
              AND (
                  (b.start_time IS NULL AND b.end_time IS NULL)
                  OR (b.start_time < v_slot_end AND b.end_time > v_slot_start)
              )
              AND (
                  p_for_admin = false
                  OR b.block_type = 'unavailable'
              )
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
-- 5. validate_appointment_slot() — soporta bloques
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_appointment_slot(
    p_doctor_id UUID,
    p_date      DATE,
    p_start     TIME,
    p_end       TIME,
    p_for_admin BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        NOT EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.doctor_id = p_doctor_id
              AND a.scheduled_date = p_date
              AND a.status NOT IN ('cancelled', 'no_show')
              AND a.start_time < p_end
              AND a.end_time > p_start
        )
        AND NOT EXISTS (
            SELECT 1
            FROM appointment_blocks b
            WHERE b.doctor_id = p_doctor_id
              AND b.block_date = p_date
              AND (
                  (b.start_time IS NULL AND b.end_time IS NULL)
                  OR (b.start_time < p_end AND b.end_time > p_start)
              )
              AND (
                  p_for_admin = false
                  OR b.block_type = 'unavailable'
              )
        );
$$;

-- -------------------------------------------------
-- 6. Ampliar CHECK constraint de telegram_notifications
--    para soportar el nuevo evento 'new_appointment_admin'
--    (notificación al doctor cuando la admin agenda).
-- -------------------------------------------------
ALTER TABLE telegram_notifications
    DROP CONSTRAINT IF EXISTS telegram_notifications_notification_type_check;

ALTER TABLE telegram_notifications
    ADD CONSTRAINT telegram_notifications_notification_type_check
    CHECK (notification_type IN (
        'reminder_24h',
        'doctor_daily_report',
        'welcome',
        'link_confirmation',
        'new_appointment_admin'
    ));
