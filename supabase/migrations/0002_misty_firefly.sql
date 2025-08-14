/*
  # Fix Companies RLS Policies

  1. Changes
    - Ajout de politiques RLS pour permettre aux utilisateurs authentifiés de :
      - Créer des sociétés
      - Modifier leurs sociétés
      - Supprimer leurs sociétés
    - Modification de la politique de lecture pour inclure les sociétés partagées
*/

-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
DROP POLICY IF EXISTS "Users can insert into their companies" ON companies;

-- Politique de lecture
CREATE POLICY "Users can view their companies"
ON companies FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Politique d'insertion
CREATE POLICY "Users can create companies"
ON companies FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique de mise à jour
CREATE POLICY "Users can update their companies"
ON companies FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Politique de suppression
CREATE POLICY "Users can delete their companies"
ON companies FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);