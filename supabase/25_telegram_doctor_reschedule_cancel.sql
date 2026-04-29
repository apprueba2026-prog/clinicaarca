-- ============================================================
-- Clinica Arca - 25: Notificaciones Telegram doctor
--                    para reprogramación y cancelación admin
--
-- Amplía el CHECK constraint de telegram_notifications para
-- soportar los nuevos tipos:
--   - 'rescheduled_admin': admin reprogramó la cita
--   - 'cancelled_admin':   admin canceló la cita
-- ============================================================

ALTER TABLE telegram_notifications
    DROP CONSTRAINT IF EXISTS telegram_notifications_notification_type_check;

ALTER TABLE telegram_notifications
    ADD CONSTRAINT telegram_notifications_notification_type_check
    CHECK (notification_type IN (
        'reminder_24h',
        'doctor_daily_report',
        'welcome',
        'link_confirmation',
        'new_appointment_admin',
        'rescheduled_admin',
        'cancelled_admin'
    ));
