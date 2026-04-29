-- ============================================================
-- Clinica Arca - 23: Restore RLS Helper Privileges
-- Restaura los permisos EXECUTE necesarios para las funciones
-- de seguridad utilizadas en las políticas RLS.
--
-- Explicación:
-- En la migración 22, se revocó el permiso de ejecución a PUBLIC,
-- anon y authenticated. Sin embargo, para que PostgreSQL evalúe
-- correctamente una política RLS que invoca una función, el
-- usuario actual de la sesión (anon o authenticated) DEBE tener
-- el permiso EXECUTE sobre dicha función, incluso si la función
-- es SECURITY DEFINER.
--
-- Se restauran los permisos exclusivamente a los roles que los
-- necesitan, manteniendo así resueltas las advertencias del
-- Supabase Security Advisor (que se quejaba del rol PUBLIC).
-- ============================================================

GRANT EXECUTE ON FUNCTION public.auth_role()     TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin()      TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff()      TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_patient()    TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_patient_id() TO anon, authenticated, service_role;
