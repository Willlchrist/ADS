/*
# Storage bucket for lesson files

Creates a public-readable bucket `lesson-files` for storing PDFs and other materials.
Write access is restricted to authenticated admins via Storage policies.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-files', 'lesson-files', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for lesson files
DROP POLICY IF EXISTS "Public read lesson files" ON storage.objects;
CREATE POLICY "Public read lesson files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'lesson-files');

-- Admin upload
DROP POLICY IF EXISTS "Admin upload lesson files" ON storage.objects;
CREATE POLICY "Admin upload lesson files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lesson-files' AND public.is_admin());

-- Admin update
DROP POLICY IF EXISTS "Admin update lesson files" ON storage.objects;
CREATE POLICY "Admin update lesson files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'lesson-files' AND public.is_admin())
  WITH CHECK (bucket_id = 'lesson-files' AND public.is_admin());

-- Admin delete
DROP POLICY IF EXISTS "Admin delete lesson files" ON storage.objects;
CREATE POLICY "Admin delete lesson files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'lesson-files' AND public.is_admin());
