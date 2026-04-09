-- ============================================
-- Clinica Arca - 14: Rate Limiting nativo en Postgres
-- ============================================
-- Reemplaza la dependencia de Upstash Redis con una solución
-- 100% Postgres usando una tabla y una función RPC atómica.
--
-- Estrategia: sliding window con buckets por (identifier, window_start).
-- Cada llamada a check_rate_limit() hace un UPSERT atómico que incrementa
-- el contador y devuelve si se permitió o no la request.
-- ============================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
    identifier    TEXT NOT NULL,            -- IP, user_id, etc.
    window_start  TIMESTAMPTZ NOT NULL,     -- inicio del bucket actual
    count         INT NOT NULL DEFAULT 0,
    PRIMARY KEY (identifier, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window
    ON public.rate_limits(window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo service_role puede leer/escribir.

-- -------------------------------------------------
-- check_rate_limit(): UPSERT atómico + decisión
-- -------------------------------------------------
-- Devuelve TRUE si la request es permitida (no excede el límite).
-- Devuelve FALSE si excede.
--
-- Estrategia:
--   1. Calcula el inicio del bucket: floor(now / window_seconds)
--   2. UPSERT con incremento atómico
--   3. Si el count resultante > p_max, devuelve FALSE
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier      TEXT,
    p_max             INT,
    p_window_seconds  INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_new_count    INT;
BEGIN
    -- Bucket alineado al ventana actual
    v_window_start := to_timestamp(
        floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
    );

    INSERT INTO public.rate_limits (identifier, window_start, count)
    VALUES (p_identifier, v_window_start, 1)
    ON CONFLICT (identifier, window_start)
    DO UPDATE SET count = public.rate_limits.count + 1
    RETURNING count INTO v_new_count;

    -- Limpieza oportunista de buckets antiguos (10% de probabilidad)
    IF random() < 0.1 THEN
        DELETE FROM public.rate_limits
        WHERE window_start < now() - (p_window_seconds * 2 || ' seconds')::interval;
    END IF;

    RETURN v_new_count <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT) TO service_role;
