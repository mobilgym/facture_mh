/*
  # Ajout des catégories de documents

  1. Nouvelles Tables
    - `document_categories` : Table de référence pour les catégories
      - `id` (text, primary key)
      - `name` (text)
      - `created_at` (timestamptz)
    
  2. Modifications
    - Ajout de la colonne `category_id` à la table `files`
    - Ajout d'une contrainte de clé étrangère vers `document_categories`
    
  3. Données initiales
    - Insertion des catégories par défaut (RH, Comptabilité, Juridique, Administration)
*/

-- Création de la table des catégories
CREATE TABLE document_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ajout de la colonne catégorie aux fichiers
ALTER TABLE files
ADD COLUMN category_id text REFERENCES document_categories(id);

-- Création d'un index pour améliorer les performances
CREATE INDEX idx_files_category ON files(category_id);

-- Insertion des catégories par défaut
INSERT INTO document_categories (id, name) VALUES
  ('rh', 'Ressources Humaines'),
  ('compta', 'Comptabilité'),
  ('juridique', 'Juridique'),
  ('admin', 'Administration');

-- Activation de RLS
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour document_categories
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les catégories"
  ON document_categories FOR SELECT
  TO authenticated
  USING (true);