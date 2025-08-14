/*
  # Ajout de la gestion des clients

  1. Nouvelles Tables
    - `clients`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `siret` (text)
      - `vat_number` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Relations
    - Liaison avec la table companies
    - Mise à jour des tables invoices et quotes

  3. Sécurité
    - Activation RLS
    - Politiques d'accès basées sur l'appartenance à la société
*/

-- Table des clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  siret text,
  vat_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Politique RLS
CREATE POLICY "Users can manage their clients"
ON clients
USING (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Index pour les performances
CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_email ON clients(email);

-- Mise à jour des tables existantes
ALTER TABLE invoices
ADD COLUMN client_id uuid REFERENCES clients(id);

ALTER TABLE quotes
ADD COLUMN client_id uuid REFERENCES clients(id);

-- Index pour les relations
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_quotes_client ON quotes(client_id);