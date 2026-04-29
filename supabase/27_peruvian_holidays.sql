-- ============================================================
-- Clinica Arca - 27: Soporte feriados peruanos (Fase 7 v1.1)
--
-- Crea una tabla holidays(date, name) con los feriados oficiales
-- peruanos pre-cargados para 2026 y 2027. Se complementa con un
-- trigger que, al insertar un feriado, crea automáticamente un
-- bloque 'unavailable' en appointment_blocks para CADA doctor
-- existente.
--
-- Eso garantiza que el flujo público y la IA Noé respeten los
-- feriados sin intervención manual del admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_national BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view holidays" ON holidays;
CREATE POLICY "Public can view holidays"
    ON holidays FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage holidays" ON holidays;
CREATE POLICY "Staff can manage holidays"
    ON holidays FOR ALL
    USING (is_staff()) WITH CHECK (is_staff());

-- ----------------- Trigger: crear bloque unavailable por doctor -----------------
CREATE OR REPLACE FUNCTION public.create_holiday_blocks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_doctor RECORD;
BEGIN
    FOR v_doctor IN SELECT id FROM doctors LOOP
        INSERT INTO appointment_blocks (
            doctor_id, block_type, block_date, start_time, end_time, title, notes
        ) VALUES (
            v_doctor.id, 'unavailable', NEW.holiday_date,
            NULL, NULL,
            'Feriado: ' || NEW.name,
            'Bloqueo automático por feriado nacional.'
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_holiday_blocks ON holidays;
CREATE TRIGGER trg_create_holiday_blocks
    AFTER INSERT ON holidays
    FOR EACH ROW
    EXECUTE FUNCTION public.create_holiday_blocks();

-- ----------------- Trigger inverso: limpiar bloques al borrar feriado -----------------
CREATE OR REPLACE FUNCTION public.remove_holiday_blocks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM appointment_blocks
    WHERE block_date = OLD.holiday_date
      AND title LIKE 'Feriado:%';
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_remove_holiday_blocks ON holidays;
CREATE TRIGGER trg_remove_holiday_blocks
    AFTER DELETE ON holidays
    FOR EACH ROW
    EXECUTE FUNCTION public.remove_holiday_blocks();

-- ----------------- Pre-carga de feriados peruanos 2026 + 2027 -----------------
-- Fuente: SUNAFIL / DS 026-2024-PCM (feriados nacionales, no incluye
-- regionales como Día del Cusco). Idempotente vía ON CONFLICT.

INSERT INTO holidays (holiday_date, name) VALUES
    -- 2026
    ('2026-01-01', 'Año Nuevo'),
    ('2026-04-02', 'Jueves Santo'),
    ('2026-04-03', 'Viernes Santo'),
    ('2026-05-01', 'Día del Trabajo'),
    ('2026-06-07', 'Batalla de Arica y Día de la Bandera'),
    ('2026-06-29', 'San Pedro y San Pablo'),
    ('2026-07-23', 'Día de la Fuerza Aérea del Perú'),
    ('2026-07-28', 'Día de la Independencia'),
    ('2026-07-29', 'Día de la Independencia'),
    ('2026-08-06', 'Batalla de Junín'),
    ('2026-08-30', 'Santa Rosa de Lima'),
    ('2026-10-08', 'Combate de Angamos'),
    ('2026-11-01', 'Día de Todos los Santos'),
    ('2026-12-08', 'Inmaculada Concepción'),
    ('2026-12-09', 'Batalla de Ayacucho'),
    ('2026-12-25', 'Navidad'),
    -- 2027
    ('2027-01-01', 'Año Nuevo'),
    ('2027-03-25', 'Jueves Santo'),
    ('2027-03-26', 'Viernes Santo'),
    ('2027-05-01', 'Día del Trabajo'),
    ('2027-06-07', 'Batalla de Arica y Día de la Bandera'),
    ('2027-06-29', 'San Pedro y San Pablo'),
    ('2027-07-23', 'Día de la Fuerza Aérea del Perú'),
    ('2027-07-28', 'Día de la Independencia'),
    ('2027-07-29', 'Día de la Independencia'),
    ('2027-08-06', 'Batalla de Junín'),
    ('2027-08-30', 'Santa Rosa de Lima'),
    ('2027-10-08', 'Combate de Angamos'),
    ('2027-11-01', 'Día de Todos los Santos'),
    ('2027-12-08', 'Inmaculada Concepción'),
    ('2027-12-09', 'Batalla de Ayacucho'),
    ('2027-12-25', 'Navidad')
ON CONFLICT (holiday_date) DO NOTHING;
