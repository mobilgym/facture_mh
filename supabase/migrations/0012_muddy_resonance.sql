/*
  # Fix storage policies and configuration
  
  1. Changes
    - Update storage bucket configuration
    - Fix storage policies for better security
    - Add proper MIME type validation
*/

-- Update storage bucket configuration
UPDATE storage.buckets
SET public = true,
    file_size_limit = 104857600, -- 100MB
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
WHERE id = 'files';

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read files" ON storage.objects;

-- Create new policies
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'files' AND
  (CASE 
    WHEN array_length(regexp_split_to_array(name, '/'), 1) >= 2 THEN
      (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
    ELSE false
  END)
);

CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'files');

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;