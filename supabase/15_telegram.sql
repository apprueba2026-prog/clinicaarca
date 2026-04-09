-- ============================================================
-- 15_telegram.sql — Integración Telegram para Noé
-- ============================================================
-- Tablas:
--  * telegram_users        — vinculación entre chat_id ↔ paciente/doctor
--  * telegram_link_tokens  — tokens one-shot para deep-link y flujo /vincular
--  * telegram_notifications — log de mensajes enviados
--
-- RLS: todas las tablas son service_role-only. El webhook y los crons
--      usan el service role client; el frontend nunca las consulta.
-- ============================================================

-- ------------------------------------------------------------
-- telegram_users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  telegram_first_name TEXT,
  linked_entity_type TEXT NOT NULL CHECK (linked_entity_type IN ('patient','doctor')),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','unlinked')),
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT telegram_users_exactly_one_entity CHECK (
    (patient_id IS NOT NULL)::int + (doctor_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_telegram_users_patient
  ON telegram_users(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telegram_users_doctor
  ON telegram_users(doctor_id) WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telegram_users_status
  ON telegram_users(status);

-- ------------------------------------------------------------
-- telegram_link_tokens
-- Dos usos:
--  1. Deep-link web: el chat web crea un token para patient_id y devuelve
--     t.me/<bot>?start=<token>. El bot consume en /start <token>.
--  2. Flujo /vincular desde Telegram: se crea un token sin patient_id,
--     se guarda el chat_id del usuario, luego el bot pide DNI → encuentra
--     patient_id → pide OTP → al verificar, promueve a telegram_users.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  token TEXT PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT,
  step TEXT NOT NULL DEFAULT 'pending' CHECK (step IN ('pending','awaiting_dni','awaiting_otp','consumed')),
  dni TEXT,
  otp_code TEXT,
  otp_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_chat
  ON telegram_link_tokens(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- ------------------------------------------------------------
-- telegram_notifications (log de envíos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id UUID NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'reminder_24h','doctor_daily_report','welcome','link_confirmation'
  )),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','skipped')),
  telegram_message_id BIGINT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_notifications_user
  ON telegram_notifications(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_appointment
  ON telegram_notifications(appointment_id) WHERE appointment_id IS NOT NULL;

-- ------------------------------------------------------------
-- Trigger updated_at
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_telegram_users_updated_at ON telegram_users;
CREATE TRIGGER trg_telegram_users_updated_at
  BEFORE UPDATE ON telegram_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ------------------------------------------------------------
-- RLS: service_role only
-- ------------------------------------------------------------
ALTER TABLE telegram_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_link_tokens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_notifications ENABLE ROW LEVEL SECURITY;

-- Sin policies públicas = solo service_role puede leer/escribir.
-- (Authenticated/anon tienen acceso 0 por default con RLS activo.)

COMMENT ON TABLE telegram_users IS 'Vinculación Telegram chat_id ↔ paciente/doctor. Service role only.';
COMMENT ON TABLE telegram_link_tokens IS 'Tokens one-shot para deep-link web y flujo /vincular. Expiran en 15 min.';
COMMENT ON TABLE telegram_notifications IS 'Log de mensajes enviados vía Telegram (reminders, reportes).';
