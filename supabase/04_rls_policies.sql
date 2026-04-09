-- ============================================
-- Clinica Arca - 04: RLS Policies
-- ============================================

-- Helper: check if the current user has a given role
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Helper: check if user is staff (any authenticated role)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'dentist', 'receptionist')
          AND is_active = true
    );
$$;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role = 'admin'
          AND is_active = true
    );
$$;

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE news               ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (is_admin());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Public can view profiles of public doctors"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM doctors
            WHERE doctors.profile_id = profiles.id
              AND doctors.is_public = true
        )
    );

CREATE POLICY "Admin can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (is_admin());

-- ============================================
-- PATIENTS
-- ============================================
CREATE POLICY "Staff can view patients"
    ON patients FOR SELECT
    USING (is_staff());

CREATE POLICY "Staff can insert patients"
    ON patients FOR INSERT
    WITH CHECK (is_staff());

CREATE POLICY "Staff can update patients"
    ON patients FOR UPDATE
    USING (is_staff());

CREATE POLICY "Staff can delete patients"
    ON patients FOR DELETE
    USING (is_staff());

-- ============================================
-- DOCTORS
-- ============================================
CREATE POLICY "Public can view doctors"
    ON doctors FOR SELECT
    USING (true);

CREATE POLICY "Admin can insert doctors"
    ON doctors FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admin can update doctors"
    ON doctors FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admin can delete doctors"
    ON doctors FOR DELETE
    USING (is_admin());

-- ============================================
-- DOCTOR_SCHEDULES
-- ============================================
CREATE POLICY "Public can view doctor schedules"
    ON doctor_schedules FOR SELECT
    USING (true);

CREATE POLICY "Admin can insert doctor schedules"
    ON doctor_schedules FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admin can update doctor schedules"
    ON doctor_schedules FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admin can delete doctor schedules"
    ON doctor_schedules FOR DELETE
    USING (is_admin());

-- ============================================
-- PROCEDURES
-- ============================================
CREATE POLICY "Public can view active procedures"
    ON procedures FOR SELECT
    USING (true);

CREATE POLICY "Admin can insert procedures"
    ON procedures FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admin can update procedures"
    ON procedures FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admin can delete procedures"
    ON procedures FOR DELETE
    USING (is_admin());

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE POLICY "Staff can view appointments"
    ON appointments FOR SELECT
    USING (is_staff());

CREATE POLICY "Staff can insert appointments"
    ON appointments FOR INSERT
    WITH CHECK (is_staff());

CREATE POLICY "Staff can update appointments"
    ON appointments FOR UPDATE
    USING (is_staff());

CREATE POLICY "Staff can delete appointments"
    ON appointments FOR DELETE
    USING (is_staff());

-- ============================================
-- INVOICES
-- ============================================
CREATE POLICY "Staff can view invoices"
    ON invoices FOR SELECT
    USING (is_staff());

CREATE POLICY "Staff can insert invoices"
    ON invoices FOR INSERT
    WITH CHECK (is_staff());

CREATE POLICY "Staff can update invoices"
    ON invoices FOR UPDATE
    USING (is_staff());

CREATE POLICY "Staff can delete invoices"
    ON invoices FOR DELETE
    USING (is_staff());

-- ============================================
-- INVOICE_ITEMS
-- ============================================
CREATE POLICY "Staff can view invoice items"
    ON invoice_items FOR SELECT
    USING (is_staff());

CREATE POLICY "Staff can insert invoice items"
    ON invoice_items FOR INSERT
    WITH CHECK (is_staff());

CREATE POLICY "Staff can update invoice items"
    ON invoice_items FOR UPDATE
    USING (is_staff());

CREATE POLICY "Staff can delete invoice items"
    ON invoice_items FOR DELETE
    USING (is_staff());

-- ============================================
-- TESTIMONIALS
-- ============================================
CREATE POLICY "Public can view visible published testimonials"
    ON testimonials FOR SELECT
    USING (is_visible = true AND status = 'published');

CREATE POLICY "Admin can manage all testimonials"
    ON testimonials FOR ALL
    USING (is_admin());

-- ============================================
-- STAFF_PROFILES
-- ============================================
CREATE POLICY "Public can view published staff profiles"
    ON staff_profiles FOR SELECT
    USING (status = 'published');

CREATE POLICY "Admin can manage all staff profiles"
    ON staff_profiles FOR ALL
    USING (is_admin());

-- ============================================
-- NEWS
-- ============================================
CREATE POLICY "Public can view published news"
    ON news FOR SELECT
    USING (status = 'published');

CREATE POLICY "Admin can manage all news"
    ON news FOR ALL
    USING (is_admin());

-- ============================================
-- INSURANCE_PARTNERS
-- ============================================
CREATE POLICY "Public can view active insurance partners"
    ON insurance_partners FOR SELECT
    USING (status = 'active');

CREATE POLICY "Admin can manage all insurance partners"
    ON insurance_partners FOR ALL
    USING (is_admin());

-- ============================================
-- CLINIC_SETTINGS
-- ============================================
CREATE POLICY "Admin can view clinic settings"
    ON clinic_settings FOR SELECT
    USING (is_admin());

CREATE POLICY "Admin can manage clinic settings"
    ON clinic_settings FOR ALL
    USING (is_admin());

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);
