-- ============================================================
-- 11. Fix: RLS profiles para acceso público + seguridad vista
-- ============================================================

-- -------------------------------------------------------
-- FIX 1: Permitir lectura pública de perfiles de doctores
-- Sin esto, los usuarios anónimos en /agendar-cita no
-- pueden ver nombres de doctores (el join retorna null).
-- -------------------------------------------------------
CREATE POLICY "Public can view profiles of public doctors"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM doctors
            WHERE doctors.profile_id = profiles.id
              AND doctors.is_public = true
        )
    );

-- -------------------------------------------------------
-- FIX 2: Permitir a pacientes ver su propio perfil
-- (complementa la policy existente para el portal)
-- -------------------------------------------------------
CREATE POLICY "Patients can view own profile via patient link"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patients
            WHERE patients.auth_user_id = auth.uid()
              AND patients.auth_user_id = profiles.id
        )
    );

-- -------------------------------------------------------
-- FIX 3: Admin puede crear perfiles (necesario para
-- crear doctores desde el panel admin)
-- -------------------------------------------------------
CREATE POLICY "Admin can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (is_admin());

-- -------------------------------------------------------
-- FIX 4: Vista tomorrow_appointments_to_remind
-- Cambiar de SECURITY DEFINER a SECURITY INVOKER
-- para que respete RLS del usuario que consulta.
-- -------------------------------------------------------
ALTER VIEW tomorrow_appointments_to_remind
    SET (security_invoker = on);
