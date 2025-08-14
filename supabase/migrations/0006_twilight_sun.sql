/*
  # Fix final des permissions RLS

  1. Changes
    - Réinitialisation complète des permissions
    - Simplification des politiques RLS
    - Ajout des permissions manquantes pour les séquences
*/

-- Réinitialisation des permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- Attribution des permissions de base
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Permissions pour les tables
GRANT ALL ON companies TO authenticated;
GRANT ALL ON user_companies TO authenticated;
GRANT ALL ON folders TO authenticated;
GRANT ALL ON files TO authenticated;
GRANT ALL ON folder_shares TO authenticated;

-- Permissions pour les séquences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Suppression et recréation des politiques pour companies
DROP POLICY IF EXISTS "Companies Policy" ON companies;

CREATE POLICY "Companies Policy"
ON companies
USING (
  CASE
    WHEN (SELECT current_setting('role') = 'authenticated') AND 
         (SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'authenticated') THEN
      CASE current_setting('request.method')
        WHEN 'GET' THEN EXISTS (
          SELECT 1 FROM user_companies 
          WHERE user_companies.company_id = companies.id 
          AND user_companies.user_id = auth.uid()
        )
        WHEN 'POST' THEN true
        WHEN 'PUT' THEN EXISTS (
          SELECT 1 FROM user_companies 
          WHERE user_companies.company_id = companies.id 
          AND user_companies.user_id = auth.uid()
        )
        WHEN 'DELETE' THEN EXISTS (
          SELECT 1 FROM user_companies 
          WHERE user_companies.company_id = companies.id 
          AND user_companies.user_id = auth.uid()
        )
        ELSE false
      END
    ELSE false
  END
);