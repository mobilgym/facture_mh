/*
  # Correction de la configuration du stockage et des tables
  
  1. Modifications
    - Ajout de la colonne document_date à la table files
    - Mise à jour des politiques de stockage
    - Configuration du bucket de stockage
  
  2. Sécurité
    - Politiques de sécurité pour le stockage
    - Permissions d'accès aux fichiers
*/

-- Mise à jour de la table files
ALTER TABLE files ADD COLUMN IF NOT EXISTS document_date timestamptz DEFAULT now();
ALTER TABLE files ALTER COLUMN document_date SET NOT NULL;

-- Configuration du bucket de stockage
UPDATE storage.buckets
SET public = true,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
WHERE id = 'files';

-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Création des nouvelles politiques
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'files');

CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'files');

CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'files');

CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'files');

-- Activation de RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;