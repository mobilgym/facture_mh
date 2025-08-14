/*
  # Schéma initial pour le gestionnaire de fichiers

  1. Tables
    - `companies` : Sociétés des utilisateurs
    - `user_companies` : Relation many-to-many entre utilisateurs et sociétés
    - `folders` : Dossiers de classement
    - `files` : Fichiers uploadés
    - `folder_shares` : Partages des dossiers

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques basées sur l'authentification
*/

-- Companies
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- User Companies (relation many-to-many)
CREATE TABLE user_companies (
  user_id uuid NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- Maintenant nous pouvons créer les politiques qui référencent user_companies
CREATE POLICY "Users can view their companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their company associations"
  ON user_companies FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Folders
CREATE TABLE folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view folders of their companies"
  ON folders FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

-- Files
CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  size bigint NOT NULL,
  url text NOT NULL,
  path text NOT NULL,
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files of their companies"
  ON files FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

-- Folder Shares
CREATE TABLE folder_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('viewer', 'editor')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their folder shares"
  ON folder_shares FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    folder_id IN (
      SELECT id FROM folders
      WHERE company_id IN (
        SELECT company_id FROM user_companies
        WHERE user_id = auth.uid()
      )
    )
  );

-- Ajout des politiques d'insertion
CREATE POLICY "Users can insert into their companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can insert into user_companies"
  ON user_companies FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert into folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert folder shares"
  ON folder_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    folder_id IN (
      SELECT id FROM folders
      WHERE company_id IN (
        SELECT company_id FROM user_companies
        WHERE user_id = auth.uid()
      )
    )
  );