/*
  # Système de gestion des devis et factures

  1. Nouvelles Tables
    - `company_settings` : Configuration par société
    - `document_templates` : Modèles de documents
    - `invoices` : Factures
    - `quotes` : Devis
    - `document_items` : Lignes de prestations
    - `payment_terms` : Modalités de paiement

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques basées sur l'appartenance à la société
*/

-- Configuration des sociétés
CREATE TABLE company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  logo_url text,
  primary_color text,
  secondary_color text,
  siret text,
  vat_number text,
  legal_address text,
  payment_details text,
  terms_and_conditions text,
  document_prefix text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Modèles de documents
CREATE TABLE document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('invoice', 'quote')),
  layout jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Factures
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  template_id uuid REFERENCES document_templates(id),
  number text NOT NULL,
  client_name text NOT NULL,
  client_address text,
  client_email text,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric(15,2) NOT NULL,
  tax_rate numeric(5,2),
  tax_amount numeric(15,2),
  discount_rate numeric(5,2),
  discount_amount numeric(15,2),
  total numeric(15,2) NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Devis
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  template_id uuid REFERENCES document_templates(id),
  number text NOT NULL,
  client_name text NOT NULL,
  client_address text,
  client_email text,
  issue_date date NOT NULL,
  validity_date date NOT NULL,
  subtotal numeric(15,2) NOT NULL,
  tax_rate numeric(5,2),
  tax_amount numeric(15,2),
  discount_rate numeric(5,2),
  discount_amount numeric(15,2),
  total numeric(15,2) NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lignes de prestations
CREATE TABLE document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('invoice', 'quote')),
  document_id uuid NOT NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit_price numeric(15,2) NOT NULL,
  tax_rate numeric(5,2),
  discount_rate numeric(5,2),
  total numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Modalités de paiement
CREATE TABLE payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  days_due integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can manage their company settings"
  ON company_settings
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their document templates"
  ON document_templates
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their invoices"
  ON invoices
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their quotes"
  ON quotes
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their document items"
  ON document_items
  USING (
    (document_type = 'invoice' AND document_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())))
    OR
    (document_type = 'quote' AND document_id IN (SELECT id FROM quotes WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())))
  );

CREATE POLICY "Users can manage their payment terms"
  ON payment_terms
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Index pour les performances
CREATE INDEX idx_company_settings_company ON company_settings(company_id);
CREATE INDEX idx_document_templates_company ON document_templates(company_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_quotes_company ON quotes(company_id);
CREATE INDEX idx_document_items_document ON document_items(document_type, document_id);
CREATE INDEX idx_payment_terms_company ON payment_terms(company_id);