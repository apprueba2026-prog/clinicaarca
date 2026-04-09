-- ============================================
-- Clinica Arca - 12: AI Conversations & Email OTPs
-- ============================================
-- Tablas para persistencia del Arca Assistant (Fase 8.5):
--   ai_conversations  → sesiones del bot con tracking de tokens/costo
--   ai_messages       → historial detallado (incluye function calls/responses)
--   email_otps        → códigos de verificación por email
-- ============================================

-- -------------------------------------------------
-- ai_conversations
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          TEXT UNIQUE NOT NULL,
    patient_id          UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'abandoned')),
    ip_address          INET,
    user_agent          TEXT,
    total_tokens        INT NOT NULL DEFAULT 0,
    estimated_cost_usd  NUMERIC(10, 6) NOT NULL DEFAULT 0,
    appointment_id      UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_session ON public.ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_patient ON public.ai_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_created ON public.ai_conversations(created_at DESC);

CREATE TRIGGER trg_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------
-- ai_messages (formato Gemini Content + parts)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'model', 'function')),
    parts           JSONB NOT NULL,
    tokens          INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON public.ai_messages(conversation_id, created_at);

-- -------------------------------------------------
-- email_otps
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_otps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL,
    code            TEXT NOT NULL,
    purpose         TEXT NOT NULL DEFAULT 'booking'
                    CHECK (purpose IN ('booking', 'login')),
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    attempts        INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email_code ON public.email_otps(email, code) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.email_otps(expires_at);

-- -------------------------------------------------
-- RLS — todas service-role only (sin políticas)
-- -------------------------------------------------
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
