-- ============================================
-- Clinica Arca - 06: Storage Buckets & Policies
-- ============================================

-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES
    ('testimonial-videos', 'testimonial-videos', true),
    ('avatars',            'avatars',            true),
    ('news-images',        'news-images',        true),
    ('invoice-pdfs',       'invoice-pdfs',       false);

-- ============================================
-- testimonial-videos (public read, admin upload)
-- ============================================
CREATE POLICY "Public can view testimonial videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'testimonial-videos');

CREATE POLICY "Admin can upload testimonial videos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'testimonial-videos'
        AND (SELECT is_admin())
    );

CREATE POLICY "Admin can delete testimonial videos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'testimonial-videos'
        AND (SELECT is_admin())
    );

-- ============================================
-- avatars (public read, authenticated upload own)
-- ============================================
CREATE POLICY "Public can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- news-images (public read, admin upload)
-- ============================================
CREATE POLICY "Public can view news images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'news-images');

CREATE POLICY "Admin can upload news images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'news-images'
        AND (SELECT is_admin())
    );

CREATE POLICY "Admin can delete news images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'news-images'
        AND (SELECT is_admin())
    );

-- ============================================
-- invoice-pdfs (staff only)
-- ============================================
CREATE POLICY "Staff can view invoice PDFs"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'invoice-pdfs'
        AND (SELECT is_staff())
    );

CREATE POLICY "Staff can upload invoice PDFs"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'invoice-pdfs'
        AND (SELECT is_staff())
    );

CREATE POLICY "Staff can delete invoice PDFs"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'invoice-pdfs'
        AND (SELECT is_staff())
    );
