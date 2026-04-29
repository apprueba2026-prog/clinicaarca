-- ============================================
-- Clinica Arca - 17: DNI/Passport Support
-- Permite registrar pacientes con pasaporte
-- además de DNI peruano (8 dígitos).
-- ============================================

-- 1. Agregar columna document_type (default 'dni' para compatibilidad)
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'dni'
  CHECK (document_type IN ('dni', 'passport'));

-- 2. Modificar el CHECK constraint del campo dni
-- Primero eliminar el constraint existente
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_dni_check;

-- 3. Agregar nuevo constraint que valida según document_type:
--    - DNI: exactamente 8 dígitos numéricos
--    - Pasaporte: 6-15 caracteres alfanuméricos
ALTER TABLE patients ADD CONSTRAINT patients_dni_check CHECK (
  CASE
    WHEN document_type = 'dni' THEN dni ~ '^\d{8}$'
    WHEN document_type = 'passport' THEN dni ~ '^[A-Za-z0-9]{6,15}$'
    ELSE false
  END
);

-- 4. Actualizar el constraint UNIQUE para que sea (document_type, dni)
-- en vez de solo (dni), ya que un DNI peruano y un pasaporte podrían
-- coincidir en valor numérico
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_dni_key;
ALTER TABLE patients ADD CONSTRAINT patients_document_unique UNIQUE (document_type, dni);

-- 5. Recrear el índice de búsqueda por dni
DROP INDEX IF EXISTS idx_patients_dni;
CREATE INDEX idx_patients_dni ON patients (dni);
CREATE INDEX idx_patients_document ON patients (document_type, dni);
