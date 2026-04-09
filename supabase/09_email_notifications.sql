-- =============================================
-- 09: Email Notifications Infrastructure
-- =============================================
-- Fase 5: Soporte para notificaciones por email.
-- El envío real se hace desde Next.js API routes (Resend).
-- Este script agrega:
-- 1. Tabla de log de emails enviados (auditoría)
-- 2. Vista para recordatorios pendientes (helper para cron)

-- 1. Tabla de log de emails (auditoría)
CREATE TABLE IF NOT EXISTS email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_type TEXT NOT NULL,  -- 'confirmation', 'reminder', 'cancellation'
    related_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'sent',  -- 'sent', 'failed', 'skipped'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_log_appointment ON email_log (related_appointment_id);
CREATE INDEX idx_email_log_created ON email_log (created_at DESC);

-- RLS: solo staff puede ver el log
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view email log"
    ON email_log FOR SELECT
    USING (is_staff());

-- 2. Vista: citas de mañana que necesitan recordatorio
-- Útil para consultas desde pg_cron o Edge Functions
CREATE OR REPLACE VIEW tomorrow_appointments_to_remind
WITH (security_invoker = on) AS
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
