-- Assurer que les utilisateurs peuvent mettre à jour leurs fichiers
-- Cette migration vérifie et ajoute les politiques de mise à jour nécessaires

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Users can update files in their companies" ON files;

-- Créer la politique de mise à jour pour les fichiers
CREATE POLICY "Users can update files in their companies"
ON files FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
  )
);

-- Assurer que les utilisateurs peuvent insérer des fichiers (au cas où)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'files' 
    AND policyname = 'Users can insert files in their companies'
  ) THEN
    CREATE POLICY "Users can insert files in their companies"
    ON files FOR INSERT
    TO authenticated
    WITH CHECK (
      company_id IN (
        SELECT company_id FROM user_companies
        WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Assurer que les utilisateurs peuvent supprimer leurs fichiers (au cas où)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'files' 
    AND policyname = 'Users can delete files in their companies'
  ) THEN
    CREATE POLICY "Users can delete files in their companies"
    ON files FOR DELETE
    TO authenticated
    USING (
      company_id IN (
        SELECT company_id FROM user_companies
        WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Commentaire pour documenter les politiques
COMMENT ON TABLE files IS 'Table des fichiers avec politiques RLS complètes pour SELECT, INSERT, UPDATE et DELETE';