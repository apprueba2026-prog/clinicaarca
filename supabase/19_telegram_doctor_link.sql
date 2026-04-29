-- ============================================
-- Clinica Arca - 19: Telegram Doctor Linking
-- Permite generar tokens de vinculación Telegram
-- también para doctores (no solo pacientes), con
-- el flujo deep-link desde el panel admin.
-- ============================================

-- 1. Columna doctor_id (paralela a patient_id existente)
ALTER TABLE telegram_link_tokens
    ADD COLUMN IF NOT EXISTS doctor_id UUID
    REFERENCES doctors(id) ON DELETE CASCADE;

-- 2. Columna link_role para distinguir intención del token
ALTER TABLE telegram_link_tokens
    ADD COLUMN IF NOT EXISTS link_role TEXT NOT NULL DEFAULT 'patient'
    CHECK (link_role IN ('patient', 'doctor'));

-- 3. Índice para lookup por doctor
CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_doctor
    ON telegram_link_tokens(doctor_id) WHERE doctor_id IS NOT NULL;

-- 4. Constraint: el token debe apuntar a paciente XOR doctor (o ninguno
--    durante el flujo /vincular). Si link_role='patient' → patient_id
--    puede estar (o no, en awaiting_dni). Si link_role='doctor' → doctor_id
--    debe estar y patient_id NULL.
ALTER TABLE telegram_link_tokens
    DROP CONSTRAINT IF EXISTS telegram_link_tokens_role_target_check;

ALTER TABLE telegram_link_tokens
    ADD CONSTRAINT telegram_link_tokens_role_target_check CHECK (
        (link_role = 'patient' AND doctor_id IS NULL)
        OR (link_role = 'doctor' AND patient_id IS NULL AND doctor_id IS NOT NULL)
    );

COMMENT ON COLUMN telegram_link_tokens.doctor_id IS
    'Set when link_role=doctor. Token pre-asocia al doctor que lo generó desde el panel admin.';
COMMENT ON COLUMN telegram_link_tokens.link_role IS
    'patient (default, flujo deep-link y /vincular) | doctor (flujo deep-link admin).';
