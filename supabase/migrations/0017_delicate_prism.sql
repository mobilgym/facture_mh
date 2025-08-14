/*
  # Ajout des colonnes année et mois

  1. Modifications
    - Ajout de la colonne `year` pour stocker l'année du document
    - Ajout de la colonne `month` pour stocker le mois du document
    - Mise à jour des données existantes
    - Création d'index pour optimiser les recherches

  2. Sécurité
    - Les politiques existantes s'appliquent aux nouvelles colonnes
*/

-- Ajout des colonnes
ALTER TABLE files
ADD COLUMN IF NOT EXISTS year text,
ADD COLUMN IF NOT EXISTS month text;

-- Mise à jour des données existantes
UPDATE files
SET 
  year = EXTRACT(YEAR FROM document_date)::text,
  month = LPAD(EXTRACT(MONTH FROM document_date)::text, 2, '0')
WHERE year IS NULL OR month IS NULL;

-- Création des index
CREATE INDEX IF NOT EXISTS idx_files_year ON files(year);
CREATE INDEX IF NOT EXISTS idx_files_month ON files(month);
CREATE INDEX IF NOT EXISTS idx_files_year_month ON files(year, month);