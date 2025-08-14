-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'files' AND
  auth.uid() = owner
);

CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete their files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'files' AND
  auth.uid() = owner
);