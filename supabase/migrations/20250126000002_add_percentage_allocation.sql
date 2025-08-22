-- Migration pour ajouter le support des pourcentages dans les assignations de badges
-- Date: 2025-01-26
-- Description: Ajout de la colonne percentage_allocated à la table file_badges pour supporter les répartitions par pourcentage

-- Ajouter la colonne percentage_allocated à la table file_badges
ALTER TABLE file_badges 
ADD COLUMN IF NOT EXISTS percentage_allocated numeric(5,2) CHECK (percentage_allocated >= 0 AND percentage_allocated <= 100);

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN file_badges.percentage_allocated IS 'Pourcentage du montant total du fichier alloué à ce badge (0-100)';

-- Index pour améliorer les performances des requêtes par pourcentage
CREATE INDEX IF NOT EXISTS idx_file_badges_percentage ON file_badges(percentage_allocated);

-- Mettre à jour les enregistrements existants avec un pourcentage par défaut
-- Calculer automatiquement le pourcentage basé sur le montant alloué vs montant total du fichier
UPDATE file_badges 
SET percentage_allocated = CASE 
  WHEN f.amount > 0 AND fb.amount_allocated IS NOT NULL 
  THEN ROUND((fb.amount_allocated / f.amount * 100)::numeric, 2)
  ELSE NULL
END
FROM files f
WHERE f.id = file_badges.file_id 
  AND file_badges.percentage_allocated IS NULL;

-- Ajouter une contrainte pour s'assurer que la somme des pourcentages par fichier ne dépasse pas 100%
-- Note: Contrainte commentée car elle peut causer des problèmes lors des mises à jour simultanées
-- et la validation est gérée au niveau applicatif

-- CREATE OR REPLACE FUNCTION check_percentage_total()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF (
--     SELECT COALESCE(SUM(percentage_allocated), 0) 
--     FROM file_badges 
--     WHERE file_id = NEW.file_id 
--     AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
--   ) + COALESCE(NEW.percentage_allocated, 0) > 100 THEN
--     RAISE EXCEPTION 'La somme des pourcentages alloués dépasse 100%% pour ce fichier';
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_check_percentage_total
--   BEFORE INSERT OR UPDATE ON file_badges
--   FOR EACH ROW EXECUTE FUNCTION check_percentage_total();
