-- ============================================================
-- 16_security_hardening.sql — Corrige advertencias del Security Advisor
-- ============================================================
-- Problemas atendidos (tras lint en producción):
--
-- 1. WARNING: Function Search Path Mutable
--    Las funciones públicas sin `search_path` fijo son vulnerables
--    a search_path hijacking (un usuario con permisos puede crear
--    objetos homónimos en un schema propio y alterar el comportamiento).
--    Fix: ALTER FUNCTION ... SET search_path = public, pg_temp.
--
-- 2. INFO: RLS Enabled No Policy
--    Tablas con RLS activo pero sin policies. Funcionalmente correcto
--    (service_role bypasea RLS, anon/authenticated obtienen 0 filas),
--    pero el linter marca la ausencia de intención explícita.
--    Fix: policy explícita USING (false) para documentar "sólo service_role".
--
-- 3. Leaked Password Protection Disabled (Auth)
--    NO se puede corregir con SQL. Requiere toggle en:
--    Dashboard → Authentication → Providers → Email →
--    "Prevent sign ups with leaked passwords" = ON.
--    Documentado aquí para que quede registro histórico.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Fix: Function Search Path Mutable
-- ------------------------------------------------------------
-- Blindamos TODAS las funciones del schema public contra search_path
-- hijacking. Iteramos por pg_proc y usamos el oid::regprocedure (que
-- incluye la firma completa) para que funcione con cualquier sobrecarga
-- o número de argumentos. Idempotente: puede correrse cuantas veces sea.

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'  -- solo funciones (no agregates/windows)
      -- Excluir funciones del sistema que podrían venir de extensiones
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', rec.sig);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo fijar search_path en %: %', rec.sig, SQLERRM;
    END;
  END LOOP;
END
$$;

-- ------------------------------------------------------------
-- 2. Fix: RLS Enabled No Policy — policies explícitas "service_role only"
-- ------------------------------------------------------------
-- Estrategia: una policy USING (false) con rol `authenticated` y `anon`
-- documenta la intención y silencia al linter. service_role sigue
-- bypaseando RLS igual que antes, sin cambios funcionales.

-- Helper macro via DO para no repetir
DO $$
DECLARE
  t TEXT;
  target_tables TEXT[] := ARRAY[
    'ai_conversations',
    'ai_messages',
    'email_otps',
    'rate_limits',
    'telegram_users',
    'telegram_link_tokens',
    'telegram_notifications'
  ];
BEGIN
  FOREACH t IN ARRAY target_tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_service_role_only', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated, anon USING (false) WITH CHECK (false)',
        t || '_service_role_only',
        t
      );
    END IF;
  END LOOP;
END
$$;

-- ------------------------------------------------------------
-- 3. Leaked Password Protection — acción manual requerida
-- ------------------------------------------------------------
-- Ve a: Dashboard Supabase → Authentication → Providers → Email
--   ✅ Activar "Prevent sign ups with leaked passwords"
-- Esto consulta haveibeenpwned.com durante signup/password change.

-- ============================================================
-- FIN — ejecutar en orden tras 15_telegram.sql
-- ============================================================
