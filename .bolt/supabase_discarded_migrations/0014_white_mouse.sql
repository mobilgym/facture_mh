/*
  # Configuration du stockage et des politiques de sécurité

  1. Configuration
    - Création du bucket 'files' s'il n'existe pas
    - Configuration des limites et types de fichiers autorisés
  
  2. Sécurité
    - Politiques de sécurité simplifiées pour le stockage
    - Permissions d'accès aux fichiers pour les utilisateurs authentifiés
*/

-- Création ou mise à jour du bucket de stockage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  true,
  104857600, -- 100MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Création des nouvelles politiques simplifiées
CREATE POLICY "Enable read for authenticated users"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'files');

CREATE POLICY "Enable insert for authenticated users"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'files');

CREATE POLICY "Enable update for authenticated users"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'files');

CREATE POLICY "Enable delete for authenticated users"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'files');

-- Activation de RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;