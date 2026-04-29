-- ============================================================
-- Clinica Arca - 26: TTL automático de ai_conversations
--
-- Problema: las conversaciones del chat IA pueden contener PII
-- (nombres, DNIs enmascarados, hilos de booking). Mantenerlas
-- indefinidamente aumenta la superficie en caso de breach.
--
-- Solución: función purge_old_ai_conversations() que elimina
-- conversaciones (y mensajes asociados por CASCADE) más antiguas
-- que 30 días. Se invoca via endpoint /api/cron/purge-conversations
-- (Vercel Cron) diariamente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.purge_old_ai_conversations(
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(deleted_conversations BIGINT, deleted_messages BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cutoff TIMESTAMPTZ;
    v_msg_count BIGINT;
    v_conv_count BIGINT;
BEGIN
    v_cutoff := NOW() - (p_days || ' days')::INTERVAL;

    -- Contar mensajes que se borrarán por CASCADE
    SELECT COUNT(*) INTO v_msg_count
    FROM ai_conversation_messages m
    JOIN ai_conversations c ON c.id = m.conversation_id
    WHERE c.created_at < v_cutoff;

    -- Borrar las conversaciones (los mensajes caen por CASCADE)
    WITH deleted AS (
        DELETE FROM ai_conversations
        WHERE created_at < v_cutoff
        RETURNING id
    )
    SELECT COUNT(*) INTO v_conv_count FROM deleted;

    deleted_conversations := v_conv_count;
    deleted_messages := v_msg_count;
    RETURN NEXT;
END;
$$;

-- Solo service_role puede ejecutar (vía endpoint cron)
REVOKE EXECUTE ON FUNCTION public.purge_old_ai_conversations(INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_ai_conversations(INTEGER)
    TO service_role;

COMMENT ON FUNCTION public.purge_old_ai_conversations IS
    'Elimina conversaciones IA más antiguas que p_days. Llamada por cron diario.';
