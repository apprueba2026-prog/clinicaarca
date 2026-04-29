-- ============================================
-- Clinica Arca - 21: Actualizar horario laboral a 09:00-20:00
-- La clínica unifica el horario de atención: lunes a sábado
-- de 09:00 AM a 08:00 PM (20:00). Domingos cerrado.
--
-- Este script actualiza los datos existentes en la BD:
--   - doctor_schedules: cualquier registro con start_time < 09:00
--     se ajusta a 09:00 (preserva end_time si ya era razonable).
--   - clinic_settings: actualiza la entrada working_hours.
--
-- Es idempotente: puede correrse varias veces sin efectos
-- adicionales una vez normalizada la BD.
-- ============================================

-- 1. doctor_schedules — empujar el inicio al menos a 09:00
UPDATE doctor_schedules
   SET start_time = '09:00'
 WHERE start_time < '09:00';

-- 2. doctor_schedules — recortar el fin a 20:00 si excediera
UPDATE doctor_schedules
   SET end_time = '20:00'
 WHERE end_time > '20:00';

-- 3. clinic_settings — actualizar working_hours si la fila existe
UPDATE clinic_settings
   SET value = '{"lunes_sabado": "09:00 - 20:00", "domingo": "cerrado"}'::jsonb,
       description = 'Horarios de atención',
       updated_at = NOW()
 WHERE key = 'working_hours';

-- 4. clinic_settings — insertar si no existía
INSERT INTO clinic_settings (key, value, description)
SELECT
    'working_hours',
    '{"lunes_sabado": "09:00 - 20:00", "domingo": "cerrado"}'::jsonb,
    'Horarios de atención'
WHERE NOT EXISTS (
    SELECT 1 FROM clinic_settings WHERE key = 'working_hours'
);
