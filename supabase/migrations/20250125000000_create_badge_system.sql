/*
  # Système de badges pour remplacer les postes de dépenses
  
  1. Tables
    - `badges` : Badges avec nom, couleur et description
    - `budget_badges` : Relations entre budgets et badges autorisés
    - `file_badges` : Relations entre fichiers/factures et badges assignés
    
  2. Migration des données existantes
    - Conversion des postes de dépenses en badges
    - Migration des relations existantes
    
  3. Suppression de l'ancien système
    - Tables expense_categories et budget_expense_categories
    - Colonnes expense_category_id
*/

-- Créer la table des badges
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#3B82F6',
  icon text, -- Optionnel : icône pour le badge
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL,
  CONSTRAINT badges_company_name_key UNIQUE (company_id, name)
);

-- Table de liaison entre budgets et badges autorisés
CREATE TABLE IF NOT EXISTS budget_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL,
  CONSTRAINT budget_badges_unique UNIQUE (budget_id, badge_id)
);

-- Table de liaison entre fichiers/factures et badges assignés
CREATE TABLE IF NOT EXISTS file_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  amount_allocated numeric(15,2), -- Montant alloué à ce badge (pour répartition partielle)
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL,
  CONSTRAINT file_badges_unique UNIQUE (file_id, badge_id)
);

-- Migrer les données existantes des postes de dépenses vers les badges
DO $$ 
BEGIN
  -- Migrer expense_categories vers badges
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expense_categories') THEN
    INSERT INTO badges (company_id, name, description, color, created_by, created_at)
    SELECT 
      company_id,
      name,
      description,
      COALESCE(color, '#3B82F6'),
      created_by,
      created_at
    FROM expense_categories
    WHERE is_active = true
    ON CONFLICT (company_id, name) DO NOTHING;
    
    -- Migrer budget_expense_categories vers budget_badges
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_expense_categories') THEN
      INSERT INTO budget_badges (budget_id, badge_id, created_by, created_at)
      SELECT 
        bec.budget_id,
        b.id as badge_id,
        bec.created_by,
        bec.created_at
      FROM budget_expense_categories bec
      JOIN expense_categories ec ON bec.expense_category_id = ec.id
      JOIN badges b ON (b.company_id = ec.company_id AND b.name = ec.name)
      ON CONFLICT (budget_id, badge_id) DO NOTHING;
    END IF;
    
    -- Migrer les relations files -> expense_categories vers file_badges
    INSERT INTO file_badges (file_id, badge_id, amount_allocated, created_by, created_at)
    SELECT 
      f.id as file_id,
      b.id as badge_id,
      f.amount as amount_allocated,
      f.created_by,
      f.created_at
    FROM files f
    JOIN expense_categories ec ON f.expense_category_id = ec.id
    JOIN badges b ON (b.company_id = ec.company_id AND b.name = ec.name)
    WHERE f.expense_category_id IS NOT NULL
    ON CONFLICT (file_id, badge_id) DO NOTHING;
  END IF;
END $$;

-- Ajouter les nouvelles colonnes aux tables existantes si nécessaire
ALTER TABLE files ADD COLUMN IF NOT EXISTS badge_ids uuid[]; -- Array de badges pour compatibilité

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_badges_company ON badges(company_id);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active);
CREATE INDEX IF NOT EXISTS idx_budget_badges_budget ON budget_badges(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_badges_badge ON budget_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_file_badges_file ON file_badges(file_id);
CREATE INDEX IF NOT EXISTS idx_file_badges_badge ON file_badges(badge_id);

-- RLS (Row Level Security)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_badges ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour badges
CREATE POLICY "Users can view badges of their company" ON badges
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage badges of their company" ON badges
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Politiques de sécurité pour budget_badges
CREATE POLICY "Users can view budget badges of their company" ON budget_badges
  FOR SELECT USING (
    budget_id IN (
      SELECT id FROM budgets 
      WHERE company_id IN (
        SELECT company_id FROM user_companies 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage budget badges of their company" ON budget_badges
  FOR ALL USING (
    budget_id IN (
      SELECT id FROM budgets 
      WHERE company_id IN (
        SELECT company_id FROM user_companies 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Politiques de sécurité pour file_badges
CREATE POLICY "Users can view file badges of their company" ON file_badges
  FOR SELECT USING (
    file_id IN (
      SELECT id FROM files 
      WHERE company_id IN (
        SELECT company_id FROM user_companies 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage file badges of their company" ON file_badges
  FOR ALL USING (
    file_id IN (
      SELECT id FROM files 
      WHERE company_id IN (
        SELECT company_id FROM user_companies 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Permissions
GRANT ALL ON badges TO authenticated;
GRANT ALL ON budget_badges TO authenticated;
GRANT ALL ON file_badges TO authenticated;
