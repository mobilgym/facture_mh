-- Suppression sécurisée des données
DELETE FROM files;
DELETE FROM folder_shares;
DELETE FROM folders;
DELETE FROM user_companies;
DELETE FROM companies;

-- Suppression des fichiers du stockage
DO $$
BEGIN
  -- Supprime tous les objets du bucket 'test'
  DELETE FROM storage.objects WHERE bucket_id = 'test';
END $$;