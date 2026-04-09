-- ============================================
-- Clinica Arca - 08: Seed Dra. Sonia Arca
-- Doctor principal para MVP
-- ============================================
-- IMPORTANTE: profiles.id tiene FK a auth.users.
-- Por eso primero creamos el usuario en auth.users,
-- luego el perfil (o usamos el trigger handle_new_user).
--
-- Opción A: Ejecutar este script desde el SQL Editor de Supabase
--           (que tiene acceso a auth schema).
-- Opción B: Crear el usuario desde el Dashboard > Authentication
--           y luego ejecutar solo la parte de doctor + schedules.

DO $$
DECLARE
    v_user_id    UUID;
    v_doctor_id  UUID;
BEGIN
    -- 1. Buscar si ya existe el usuario en auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'dra.sonia@clinicaarca.pe';

    -- Si no existe, crear usuario en auth.users
    -- (esto solo funciona desde el SQL Editor de Supabase con permisos de service_role)
    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();

        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'dra.sonia@clinicaarca.pe',
            crypt('ClinicaArca2026!', gen_salt('bf')),
            NOW(),
            jsonb_build_object(
                'role', 'dentist',
                'first_name', 'Sonia',
                'last_name', 'Arca'
            ),
            NOW(),
            NOW(),
            '',
            ''
        );

        -- El trigger handle_new_user() debería crear el perfil automáticamente.
        -- Pero si no existe el trigger aún, lo creamos manualmente:
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
            INSERT INTO profiles (id, email, role, first_name, last_name)
            VALUES (v_user_id, 'dra.sonia@clinicaarca.pe', 'dentist', 'Sonia', 'Arca');
        END IF;
    END IF;

    -- 2. Buscar si ya existe doctor vinculado
    SELECT id INTO v_doctor_id
    FROM doctors
    WHERE profile_id = v_user_id;

    -- Si no existe, crear el doctor
    IF v_doctor_id IS NULL THEN
        v_doctor_id := gen_random_uuid();

        INSERT INTO doctors (
            id, profile_id, specialties, license_number, bio,
            consultation_duration_minutes, is_public
        ) VALUES (
            v_doctor_id,
            v_user_id,
            ARRAY['general', 'implantes']::procedure_category[],
            'COP-12345',
            'Odontóloga con más de 15 años de experiencia en odontología general, implantes dentales y odontopediatría. Comprometida con brindar atención de calidad con tecnología de vanguardia y trato humano.',
            30,
            true
        );
    END IF;

    -- 3. Crear horarios de lunes a sábado (8:00 - 20:00)
    DELETE FROM doctor_schedules WHERE doctor_id = v_doctor_id;

    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_active)
    VALUES
        (v_doctor_id, 'lunes',     '08:00', '20:00', true),
        (v_doctor_id, 'martes',    '08:00', '20:00', true),
        (v_doctor_id, 'miercoles', '08:00', '20:00', true),
        (v_doctor_id, 'jueves',    '08:00', '20:00', true),
        (v_doctor_id, 'viernes',   '08:00', '20:00', true),
        (v_doctor_id, 'sabado',    '08:00', '20:00', true);

    RAISE NOTICE 'Dra. Sonia Arca creada: user_id=%, doctor_id=%', v_user_id, v_doctor_id;
END;
$$;
