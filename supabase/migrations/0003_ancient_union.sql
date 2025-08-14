/*
  # Fix user_companies RLS Policies

  1. Changes
    - Ajout de politiques RLS pour permettre aux utilisateurs de :
      - Créer des associations utilisateur-société
      - Voir leurs associations
    - Ajout d'un trigger pour créer automatiquement l'association lors de la création d'une société
*/

-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Users can view their company associations" ON user_companies;
DROP POLICY IF EXISTS "Users can insert into user_companies" ON user_companies;

-- Politique de lecture
CREATE POLICY "Users can view their company associations"
ON user_companies FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Politique d'insertion
CREATE POLICY "Users can create company associations"
ON user_companies FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Fonction trigger pour créer automatiquement l'association utilisateur-société
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_companies (user_id, company_id)
  VALUES (auth.uid(), NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler la fonction automatiquement
DROP TRIGGER IF EXISTS on_company_created ON companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_company();