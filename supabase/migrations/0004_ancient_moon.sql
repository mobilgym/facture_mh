/*
  # Fix Trigger Permissions

  1. Changes
    - Ajout des permissions nécessaires pour la fonction trigger
    - Modification de la fonction pour utiliser SECURITY DEFINER correctement
*/

-- Révocation des permissions existantes
REVOKE ALL ON companies FROM public;
REVOKE ALL ON user_companies FROM public;

-- Attribution des permissions nécessaires
GRANT ALL ON companies TO authenticated;
GRANT ALL ON user_companies TO authenticated;

-- Recréation de la fonction trigger avec les bonnes permissions
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.user_companies (user_id, company_id)
  VALUES (auth.uid(), NEW.id);
  RETURN NEW;
END;
$$;

-- Révocation et réattribution des permissions sur la fonction
REVOKE ALL ON FUNCTION public.handle_new_company() FROM public;
GRANT EXECUTE ON FUNCTION public.handle_new_company() TO authenticated;

-- Recréation du trigger
DROP TRIGGER IF EXISTS on_company_created ON companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_company();