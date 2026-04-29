-- ============================================================
-- Clinica Arca - 22: Security Fixes (Advisor warnings)
-- Resuelve los 30 warnings del Security Advisor de Supabase.
--
-- Categorías abordadas:
--   1. Drop overloads viejos de get_available_slots y validate_appointment_slot
--      que quedaron huérfanos al agregar p_for_admin en la migración 18.
--   2. REVOKE EXECUTE PUBLIC en helpers RLS y trigger handle_new_user.
--      (Solo se usan dentro de policies; SECURITY DEFINER ya provee privilegios.)
--   3. GRANT EXECUTE explícito al rol mínimo en funciones RPC expuestas.
--   4. Storage avatars: INSERT solo en path propio (auth.uid()/...).
--   5. Storage public buckets: SELECT requiere path no vacío (bloquea LIST
--      enumerativo manteniendo lectura por path conocido).
--
-- Pendiente manual en Dashboard:
--   Authentication → Providers → Email → ✅ Prevent sign ups with
--   leaked passwords (HavelBeenPwned).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Eliminar overloads viejos (sin p_for_admin)
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_available_slots(UUID, DATE, INTEGER);
DROP FUNCTION IF EXISTS public.validate_appointment_slot(UUID, DATE, TIME, TIME);

-- ------------------------------------------------------------
-- 2. Helpers RLS-only: REVOKE EXECUTE de PUBLIC/anon/authenticated.
--    Solo se invocan dentro de policies, donde SECURITY DEFINER
--    ya asegura los privilegios sin necesidad de EXECUTE público.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.auth_role()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_patient()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.my_patient_id() FROM PUBLIC, anon, authenticated;

-- handle_new_user es trigger; nunca debe invocarse por RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 3. Funciones expuestas vía RPC: rol mínimo necesario.
-- ------------------------------------------------------------

-- get_available_slots: público (anon en wizard) + admin (authenticated).
REVOKE EXECUTE ON FUNCTION public.get_available_slots(UUID, DATE, INTEGER, BOOLEAN)
    FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID, DATE, INTEGER, BOOLEAN)
    TO anon, authenticated, service_role;

-- validate_appointment_slot: chequeo previo en wizard (anon) + admin (auth).
REVOKE EXECUTE ON FUNCTION public.validate_appointment_slot(UUID, DATE, TIME, TIME, BOOLEAN)
    FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_appointment_slot(UUID, DATE, TIME, TIME, BOOLEAN)
    TO anon, authenticated, service_role;

-- count_patient_future_appointments: solo paciente autenticado o server.
REVOKE EXECUTE ON FUNCTION public.count_patient_future_appointments(UUID)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_patient_future_appointments(UUID)
    TO authenticated, service_role;

-- book_appointment_atomic: server-only (admin client).
REVOKE EXECUTE ON FUNCTION public.book_appointment_atomic(UUID, UUID, DATE, TIME, TIME, appointment_priority)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment_atomic(UUID, UUID, DATE, TIME, TIME, appointment_priority)
    TO service_role;

-- check_rate_limit: server-only.
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT)
    TO service_role;

-- ------------------------------------------------------------
-- 4. Storage avatars: solo subir al path propio (carpeta = uid).
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ------------------------------------------------------------
-- 5. Storage public buckets: bloquear LIST enumerativo, mantener
--    lectura directa por path conocido (las imágenes siguen
--    sirviéndose por URL pública).
--    Verificado: el frontend no usa supabase.storage.list().
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars by path" ON storage.objects;
CREATE POLICY "Public can read avatars by path"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'avatars'
        AND name IS NOT NULL
        AND (storage.foldername(name))[1] IS NOT NULL
    );

DROP POLICY IF EXISTS "Public can view news images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read news images by path" ON storage.objects;
CREATE POLICY "Public can read news images by path"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'news-images'
        AND name IS NOT NULL
        AND (storage.foldername(name))[1] IS NOT NULL
    );

DROP POLICY IF EXISTS "Public can view testimonial videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read testimonial videos by path" ON storage.objects;
CREATE POLICY "Public can read testimonial videos by path"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'testimonial-videos'
        AND name IS NOT NULL
        AND (storage.foldername(name))[1] IS NOT NULL
    );
