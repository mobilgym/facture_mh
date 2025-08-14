/*
  # Fix Companies RLS Policies

  1. Changes
    - Ajout d'une politique explicite pour l'insertion dans la table companies
    - Simplification des politiques existantes
*/

-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can update their companies" ON companies;
DROP POLICY IF EXISTS "Users can delete their companies" ON companies;

-- Politique de lecture
CREATE POLICY "Enable read access for authenticated users"
ON companies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.company_id = companies.id 
    AND user_companies.user_id = auth.uid()
  )
);

-- Politique d'insertion simplifiée
CREATE POLICY "Enable insert access for authenticated users"
ON companies FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique de mise à jour
CREATE POLICY "Enable update access for authenticated users"
ON companies FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.company_id = companies.id 
    AND user_companies.user_id = auth.uid()
  )
);

-- Politique de suppression
CREATE POLICY "Enable delete access for authenticated users"
ON companies FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.company_id = companies.id 
    AND user_companies.user_id = auth.uid()
  )
);

-- S'assurer que RLS est activé
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;