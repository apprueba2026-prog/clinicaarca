-- ============================================================
-- 10. Migración: specialty (singular) → specialties (array)
-- Permite que un doctor tenga hasta 3 especialidades
-- ============================================================

-- 0. Eliminar vista dependiente (se recrea al final)
DROP VIEW IF EXISTS tomorrow_appointments_to_remind;

-- 1. Agregar nueva columna array
ALTER TABLE doctors
  ADD COLUMN specialties procedure_category[] NOT NULL DEFAULT '{}';

-- 2. Migrar datos existentes (scalar → array de 1 elemento)
UPDATE doctors
  SET specialties = ARRAY[specialty]
  WHERE specialty IS NOT NULL;

-- 3. Eliminar columna antigua
ALTER TABLE doctors
  DROP COLUMN specialty;

-- 4. Índice GIN para consultas de contención eficientes (@>)
CREATE INDEX idx_doctors_specialties ON doctors USING GIN (specialties);

-- 5. Constraint: máximo 3 especialidades por doctor
ALTER TABLE doctors
  ADD CONSTRAINT chk_specialties_max3
  CHECK (array_length(specialties, 1) <= 3);

-- 6. Recrear vista con specialties (usa la primera como primaria)
CREATE OR REPLACE VIEW tomorrow_appointments_to_remind AS
SELECT
    a.id AS appointment_id,
    a.scheduled_date,
    a.start_time,
    a.end_time,
    p.first_name AS patient_first_name,
    p.last_name AS patient_last_name,
    p.email AS patient_email,
    d.specialties[1] AS doctor_specialty,
    dp.first_name AS doctor_first_name,
    dp.last_name AS doctor_last_name
FROM appointments a
JOIN patients p ON p.id = a.patient_id
JOIN doctors d ON d.id = a.doctor_id
JOIN profiles dp ON dp.id = d.id
WHERE a.scheduled_date = CURRENT_DATE + INTERVAL '1 day'
  AND a.status = 'confirmed'
  AND p.email IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM email_log el
      WHERE el.related_appointment_id = a.id
        AND el.template_type = 'reminder'
        AND el.status = 'sent'
  );
