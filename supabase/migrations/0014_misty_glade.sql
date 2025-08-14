/*
  # Configuration du stockage Supabase
  
  1. Configuration du bucket
    - Création du bucket 'test'
    - Configuration des limites et types MIME
    - Accès public activé
  
  2. Politiques de sécurité
    - Politiques CRUD pour les utilisateurs authentifiés
    - Permissions simplifiées
*/

-- Création/Mise à jour du bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('test', 'test', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Configuration des limites et types MIME
UPDATE storage.buckets
SET file_size_limit = 104857600, -- 100MB
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
WHERE id = 'test';

-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Enable read for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;

-- Nouvelles politiques simplifiées
CREATE POLICY "Enable read for authenticated users"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'test');

CREATE POLICY "Enable insert for authenticated users"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'test');

CREATE POLICY "Enable update for authenticated users"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'test');

CREATE POLICY "Enable delete for authenticated users"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'test');

-- Activation de RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;