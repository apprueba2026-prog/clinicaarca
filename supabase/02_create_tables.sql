-- ============================================
-- Clinica Arca - 02: Tables & Indexes
-- ============================================

-- 1. profiles
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email       TEXT NOT NULL,
    role        user_role NOT NULL DEFAULT 'receptionist',
    first_name  TEXT,
    last_name   TEXT,
    avatar_url  TEXT,
    phone       TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. insurance_partners
CREATE TABLE insurance_partners (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    logo_url      TEXT,
    contact_info  TEXT,
    status        insurance_status NOT NULL DEFAULT 'active',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. doctors
CREATE TABLE doctors (
    id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id                    UUID NOT NULL UNIQUE REFERENCES profiles ON DELETE CASCADE,
    specialty                     procedure_category,
    license_number                TEXT NOT NULL UNIQUE,
    bio                           TEXT,
    consultation_duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_public                     BOOLEAN NOT NULL DEFAULT true,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. doctor_schedules
CREATE TABLE doctor_schedules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id   UUID NOT NULL REFERENCES doctors ON DELETE CASCADE,
    day_of_week schedule_day NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (doctor_id, day_of_week)
);

-- 5. patients
CREATE TABLE patients (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni                     TEXT NOT NULL UNIQUE CHECK (dni ~ '^\d{8}$'),
    first_name              TEXT NOT NULL,
    last_name               TEXT NOT NULL,
    email                   TEXT,
    phone                   TEXT,
    birth_date              DATE,
    address                 TEXT,
    insurance_partner_id    UUID REFERENCES insurance_partners ON DELETE SET NULL,
    insurance_policy_number TEXT,
    status                  patient_status NOT NULL DEFAULT 'new',
    notes                   TEXT,
    avatar_url              TEXT,
    is_premium              BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. procedures
CREATE TABLE procedures (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                       TEXT NOT NULL,
    description                TEXT,
    category                   procedure_category NOT NULL,
    base_price                 DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active                  BOOLEAN NOT NULL DEFAULT true,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. appointments
CREATE TABLE appointments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id     UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
    doctor_id      UUID NOT NULL REFERENCES doctors ON DELETE CASCADE,
    procedure_id   UUID REFERENCES procedures ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    status         appointment_status NOT NULL DEFAULT 'pending',
    priority       appointment_priority NOT NULL DEFAULT 'normal',
    notes          TEXT,
    room           TEXT,
    created_by     UUID REFERENCES profiles ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. invoices
CREATE TABLE invoices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id     UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments ON DELETE SET NULL,
    invoice_type   invoice_type NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    ruc            TEXT,
    business_name  TEXT,
    subtotal       DECIMAL(10,2) NOT NULL,
    igv            DECIMAL(10,2) NOT NULL DEFAULT 0,
    total          DECIMAL(10,2) NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    concept        TEXT,
    issued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at        TIMESTAMPTZ,
    created_by     UUID REFERENCES profiles ON DELETE SET NULL
);

-- 9. invoice_items
CREATE TABLE invoice_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id   UUID NOT NULL REFERENCES invoices ON DELETE CASCADE,
    procedure_id UUID REFERENCES procedures ON DELETE SET NULL,
    description  TEXT NOT NULL,
    quantity     INTEGER NOT NULL DEFAULT 1,
    unit_price   DECIMAL(10,2) NOT NULL,
    total        DECIMAL(10,2) NOT NULL
);

-- 10. testimonials
CREATE TABLE testimonials (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name  TEXT NOT NULL,
    review_text   TEXT NOT NULL,
    rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    video_url     TEXT,
    thumbnail_url TEXT,
    is_featured   BOOLEAN NOT NULL DEFAULT false,
    is_visible    BOOLEAN NOT NULL DEFAULT true,
    status        content_status NOT NULL DEFAULT 'published',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. staff_profiles
CREATE TABLE staff_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id       UUID NOT NULL REFERENCES doctors ON DELETE CASCADE,
    display_name    TEXT NOT NULL,
    specialty_label TEXT,
    bio_short       TEXT,
    photo_url       TEXT,
    display_order   INTEGER NOT NULL DEFAULT 0,
    status          content_status NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. news
CREATE TABLE news (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    excerpt      TEXT,
    content      TEXT,
    image_url    TEXT,
    category     news_category NOT NULL DEFAULT 'event',
    status       content_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_by   UUID REFERENCES profiles ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. clinic_settings
CREATE TABLE clinic_settings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         TEXT NOT NULL UNIQUE,
    value       JSONB NOT NULL,
    description TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. notifications
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    type       TEXT,
    related_id UUID,
    is_read    BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_appointments_date    ON appointments (scheduled_date);
CREATE INDEX idx_appointments_doctor  ON appointments (doctor_id);
CREATE INDEX idx_appointments_patient ON appointments (patient_id);
CREATE INDEX idx_appointments_status  ON appointments (status);

CREATE INDEX idx_patients_dni    ON patients (dni);
CREATE INDEX idx_patients_status ON patients (status);

CREATE INDEX idx_invoices_patient ON invoices (patient_id);
CREATE INDEX idx_invoices_status  ON invoices (payment_status);

CREATE INDEX idx_testimonials_visible ON testimonials (is_visible);
CREATE INDEX idx_news_status          ON news (status);

CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read) WHERE is_read = false;
