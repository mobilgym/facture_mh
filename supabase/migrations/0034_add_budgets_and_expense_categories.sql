/*
  # Ajout des tables budgets et postes de dépenses

  1. Tables
    - `expense_categories` : Postes de dépenses (loyer, matériel, communication, etc.)
    - `budgets` : Budgets avec montants et suivi automatique
    - `expenses` : Dépenses (avec ou sans fichier) liées aux budgets et postes
    - Mise à jour de la table `files` pour l'intégration

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques basées sur l'authentification et l'appartenance aux entreprises

  3. Fonctionnalités
    - Mise à jour automatique des budgets lors d'ajout/suppression de dépenses
    - Support des dépenses avec et sans fichiers
    - Liens entre factures existantes et nouveaux systèmes
*/

-- Table des postes de dépenses (si elle n'existe pas déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_categories') THEN
    CREATE TABLE expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6', -- Couleur pour l'affichage (hex)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL,
  CONSTRAINT expense_categories_company_name_key UNIQUE (company_id, name)
    );
  END IF;
END $$;

-- Table des budgets (si elle n'existe pas déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budgets') THEN
    CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  initial_amount numeric(15,2) NOT NULL DEFAULT 0 CHECK (initial_amount >= 0),
  spent_amount numeric(15,2) NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
  remaining_amount numeric(15,2) GENERATED ALWAYS AS (initial_amount - spent_amount) STORED,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL,
  CONSTRAINT budgets_company_name_key UNIQUE (company_id, name),
  CONSTRAINT budgets_date_check CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CONSTRAINT budgets_spent_check CHECK (spent_amount <= initial_amount)
    );
  END IF;
END $$;

-- Table des dépenses (si elle n'existe pas déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expenses') THEN
    CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  budget_id uuid REFERENCES budgets(id) ON DELETE RESTRICT,
  expense_category_id uuid REFERENCES expense_categories(id) ON DELETE RESTRICT,
  file_id uuid REFERENCES files(id) ON DELETE SET NULL, -- Optionnel : dépense peut être sans fichier
  title text NOT NULL,
  description text,
  amount numeric(15,2) NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  vendor text, -- Fournisseur/prestataire
  reference_number text, -- Numéro de facture, bon de commande, etc.
  payment_method text CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'card', 'other')),
  is_recurring boolean DEFAULT false,
  tags text[], -- Tags pour catégorisation supplémentaire
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
    );
  END IF;
END $$;

-- Ajout de colonnes à la table files pour l'intégration
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS budget_id uuid REFERENCES budgets(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS expense_category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL;

-- Activation de RLS (si les tables existent)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_categories') THEN
    ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budgets') THEN
    ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expenses') THEN
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Politiques RLS pour expense_categories (si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_categories') THEN
    DROP POLICY IF EXISTS "Users can view expense categories of their companies" ON expense_categories;
    CREATE POLICY "Users can view expense categories of their companies"
ON expense_categories FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create expense categories" ON expense_categories;
CREATE POLICY "Users can create expense categories"
ON expense_categories FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update expense categories of their companies" ON expense_categories;
CREATE POLICY "Users can update expense categories of their companies"
ON expense_categories FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete expense categories of their companies" ON expense_categories;
CREATE POLICY "Users can delete expense categories of their companies"
ON expense_categories FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Politiques RLS pour budgets (si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budgets') THEN
    DROP POLICY IF EXISTS "Users can view budgets of their companies" ON budgets;
    CREATE POLICY "Users can view budgets of their companies"
ON budgets FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create budgets" ON budgets;
CREATE POLICY "Users can create budgets"
ON budgets FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update budgets of their companies" ON budgets;
CREATE POLICY "Users can update budgets of their companies"
ON budgets FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete budgets of their companies" ON budgets;
CREATE POLICY "Users can delete budgets of their companies"
ON budgets FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Politiques RLS pour expenses (si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expenses') THEN
    DROP POLICY IF EXISTS "Users can view expenses of their companies" ON expenses;
    CREATE POLICY "Users can view expenses of their companies"
ON expenses FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create expenses" ON expenses;
CREATE POLICY "Users can create expenses"
ON expenses FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update expenses of their companies" ON expenses;
CREATE POLICY "Users can update expenses of their companies"
ON expenses FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete expenses of their companies" ON expenses;
CREATE POLICY "Users can delete expenses of their companies"
ON expenses FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Fonction pour mettre à jour automatiquement le montant dépensé des budgets
CREATE OR REPLACE FUNCTION update_budget_spent_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Lors d'ajout d'une dépense
  IF TG_OP = 'INSERT' THEN
    IF NEW.budget_id IS NOT NULL AND NEW.status IN ('approved', 'paid') THEN
      UPDATE budgets 
      SET spent_amount = spent_amount + NEW.amount,
          updated_at = now()
      WHERE id = NEW.budget_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Lors de modification d'une dépense
  IF TG_OP = 'UPDATE' THEN
    -- Si le budget a changé ou le statut a changé
    IF OLD.budget_id IS DISTINCT FROM NEW.budget_id OR OLD.status IS DISTINCT FROM NEW.status OR OLD.amount IS DISTINCT FROM NEW.amount THEN
      
      -- Retirer de l'ancien budget si applicable
      IF OLD.budget_id IS NOT NULL AND OLD.status IN ('approved', 'paid') THEN
        UPDATE budgets 
        SET spent_amount = spent_amount - OLD.amount,
            updated_at = now()
        WHERE id = OLD.budget_id;
      END IF;
      
      -- Ajouter au nouveau budget si applicable
      IF NEW.budget_id IS NOT NULL AND NEW.status IN ('approved', 'paid') THEN
        UPDATE budgets 
        SET spent_amount = spent_amount + NEW.amount,
            updated_at = now()
        WHERE id = NEW.budget_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Lors de suppression d'une dépense
  IF TG_OP = 'DELETE' THEN
    IF OLD.budget_id IS NOT NULL AND OLD.status IN ('approved', 'paid') THEN
      UPDATE budgets 
      SET spent_amount = spent_amount - OLD.amount,
          updated_at = now()
      WHERE id = OLD.budget_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour mise à jour automatique des budgets (si n'existe pas déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trigger_update_budget_spent_amount'
      AND tgrelid = 'expenses'::regclass
  ) THEN
    CREATE TRIGGER trigger_update_budget_spent_amount
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_budget_spent_amount();
  END IF;
END $$;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheurs pour updated_at (si n'existent pas déjà)
DO $$
BEGIN
  -- Pour expense_categories
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_categories') AND
     NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'trigger_expense_categories_updated_at'
        AND tgrelid = 'expense_categories'::regclass
    ) THEN
    CREATE TRIGGER trigger_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Pour budgets
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budgets') AND
     NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'trigger_budgets_updated_at'
        AND tgrelid = 'budgets'::regclass
    ) THEN
    CREATE TRIGGER trigger_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Pour expenses
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expenses') AND
     NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'trigger_expenses_updated_at'
        AND tgrelid = 'expenses'::regclass
    ) THEN
    CREATE TRIGGER trigger_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Index pour de meilleures performances (si n'existent pas déjà)
DO $$
BEGIN
  -- Pour expense_categories
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_categories') THEN
    CREATE INDEX IF NOT EXISTS idx_expense_categories_company ON expense_categories(company_id);
    CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(company_id, is_active);
  END IF;

  -- Pour budgets
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budgets') THEN
    CREATE INDEX IF NOT EXISTS idx_budgets_company ON budgets(company_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(company_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets(start_date, end_date);
  END IF;

  -- Pour expenses
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expenses') THEN
    CREATE INDEX IF NOT EXISTS idx_expenses_company ON expenses(company_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_budget ON expenses(budget_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(expense_category_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_file ON expenses(file_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
    CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
  END IF;

  -- Pour files
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'files') THEN
    CREATE INDEX IF NOT EXISTS idx_files_expense ON files(expense_id);
    CREATE INDEX IF NOT EXISTS idx_files_budget ON files(budget_id);
    CREATE INDEX IF NOT EXISTS idx_files_expense_category ON files(expense_category_id);
  END IF;
END $$;

-- Permissions
GRANT ALL ON expense_categories TO authenticated;
GRANT ALL ON budgets TO authenticated;
GRANT ALL ON expenses TO authenticated;

-- Table de liaison entre budgets et postes de dépenses (si elle n'existe pas déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_expense_categories') THEN
    CREATE TABLE budget_expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  expense_category_id uuid REFERENCES expense_categories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL,
  CONSTRAINT budget_expense_categories_unique UNIQUE (budget_id, expense_category_id)
    );
  END IF;
END $$;

-- Activation de RLS pour la table de liaison (si elle existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_expense_categories') THEN
    ALTER TABLE budget_expense_categories ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Politiques RLS pour budget_expense_categories (si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_expense_categories') THEN
    DROP POLICY IF EXISTS "Users can view budget expense categories of their companies" ON budget_expense_categories;
    CREATE POLICY "Users can view budget expense categories of their companies"
ON budget_expense_categories FOR SELECT TO authenticated
USING (budget_id IN (
  SELECT id FROM budgets WHERE company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
));

DROP POLICY IF EXISTS "Users can create budget expense categories" ON budget_expense_categories;
CREATE POLICY "Users can create budget expense categories"
ON budget_expense_categories FOR INSERT TO authenticated
WITH CHECK (budget_id IN (
  SELECT id FROM budgets WHERE company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
));

DROP POLICY IF EXISTS "Users can delete budget expense categories" ON budget_expense_categories;
CREATE POLICY "Users can delete budget expense categories"
ON budget_expense_categories FOR DELETE TO authenticated
USING (budget_id IN (
  SELECT id FROM budgets WHERE company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
));
  END IF;
END $$;

-- Index pour la table de liaison (si elle existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_expense_categories') THEN
    CREATE INDEX IF NOT EXISTS idx_budget_expense_categories_budget ON budget_expense_categories(budget_id);
    CREATE INDEX IF NOT EXISTS idx_budget_expense_categories_category ON budget_expense_categories(expense_category_id);
  END IF;
END $$;

-- Permissions pour la table de liaison (si elle existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_expense_categories') THEN
    GRANT ALL ON budget_expense_categories TO authenticated;
  END IF;
END $$;

-- Données de test (postes de dépenses par défaut)
INSERT INTO expense_categories (company_id, name, description, color, created_by) 
SELECT 
  c.id,
  category.name,
  category.description,
  category.color,
  '00000000-0000-0000-0000-000000000000'::uuid -- ID générique pour les données par défaut
FROM companies c
CROSS JOIN (
  VALUES 
    ('Loyer & Charges', 'Loyer, charges locatives, assurances locaux', '#EF4444'),
    ('Matériel & Équipement', 'Achat d''équipements, matériel informatique, outils', '#3B82F6'),
    ('Communication & Marketing', 'Publicité, site web, réseaux sociaux, supports de communication', '#8B5CF6'),
    ('Transport & Déplacements', 'Carburant, transports, frais de déplacement', '#10B981'),
    ('Fournitures de Bureau', 'Papeterie, consommables, petit matériel de bureau', '#F59E0B'),
    ('Services Professionnels', 'Comptabilité, conseil, services juridiques', '#6B7280'),
    ('Télécommunications', 'Internet, téléphone, forfaits mobiles', '#06B6D4'),
    ('Formation & Développement', 'Formations, certifications, développement des compétences', '#84CC16'),
    ('Maintenance & Réparations', 'Entretien, réparations, maintenance préventive', '#F97316'),
    ('Autres Dépenses', 'Dépenses diverses non catégorisées', '#64748B')
) AS category(name, description, color)
ON CONFLICT (company_id, name) DO NOTHING;
