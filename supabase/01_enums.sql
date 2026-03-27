-- ============================================
-- Clinica Arca - 01: Enum Types
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'dentist', 'receptionist');

CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

CREATE TYPE patient_status AS ENUM ('active', 'inactive', 'new');

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'overdue', 'refunded');

CREATE TYPE invoice_type AS ENUM ('boleta', 'factura');

CREATE TYPE procedure_category AS ENUM ('general', 'odontopediatria', 'implantes', 'ortodoncia', 'sedacion', 'cirugia', 'estetica', 'endodoncia', 'periodoncia');

CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE news_category AS ENUM ('innovation', 'award', 'promotion', 'event');

CREATE TYPE schedule_day AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado');

CREATE TYPE appointment_priority AS ENUM ('normal', 'urgent', 'emergency');

CREATE TYPE insurance_status AS ENUM ('active', 'inactive');
