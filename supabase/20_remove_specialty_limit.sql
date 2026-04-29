-- ============================================
-- Clinica Arca - 20: Eliminar límite de especialidades
-- El constraint chk_specialties_max3 (creado en 10_doctor_multi_specialty)
-- impedía que un doctor tuviera más de 3 especialidades. Hay
-- profesionales con más de 3, por lo que se elimina la restricción.
-- Se mantiene la regla de "al menos 1 especialidad" en zod del frontend.
-- ============================================

ALTER TABLE doctors
    DROP CONSTRAINT IF EXISTS chk_specialties_max3;
