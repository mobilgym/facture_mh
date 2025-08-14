/*
  # Fix billing tables and relationships

  1. Tables
    - Drop and recreate clients table with proper structure
    - Fix invoices and quotes tables
    - Add proper relationships and constraints

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies
    - Grant proper permissions

  3. Changes
    - Ensure clean state for billing system
    - Fix all relationships between tables
*/

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS document_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Create clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  siret text,
  vat_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT clients_company_name_key UNIQUE (company_id, name)
);

-- Create invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE RESTRICT NOT NULL,
  number text NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2),
  tax_amount numeric(15,2),
  total numeric(15,2) NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT invoices_company_number_key UNIQUE (company_id, number)
);

-- Create quotes table
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE RESTRICT NOT NULL,
  number text NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  validity_date date NOT NULL,
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2),
  tax_amount numeric(15,2),
  total numeric(15,2) NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT quotes_company_number_key UNIQUE (company_id, number)
);

-- Create document items table
CREATE TABLE document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('invoice', 'quote')),
  document_id uuid NOT NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(15,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2),
  total numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT document_items_invoice_fkey FOREIGN KEY (document_id) 
    REFERENCES invoices(id) ON DELETE CASCADE 
    WHEN document_type = 'invoice',
  CONSTRAINT document_items_quote_fkey FOREIGN KEY (document_id) 
    REFERENCES quotes(id) ON DELETE CASCADE 
    WHEN document_type = 'quote'
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
CREATE POLICY "Users can view their company clients"
ON clients FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can create clients"
ON clients FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company clients"
ON clients FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company clients"
ON clients FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Create RLS policies for invoices
CREATE POLICY "Users can view their company invoices"
ON invoices FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can create invoices"
ON invoices FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company invoices"
ON invoices FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company invoices"
ON invoices FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Create RLS policies for quotes
CREATE POLICY "Users can view their company quotes"
ON quotes FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can create quotes"
ON quotes FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company quotes"
ON quotes FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company quotes"
ON quotes FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Create RLS policies for document items
CREATE POLICY "Users can manage document items"
ON document_items FOR ALL TO authenticated
USING (
  (document_type = 'invoice' AND document_id IN (
    SELECT id FROM invoices WHERE company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  ))
  OR
  (document_type = 'quote' AND document_id IN (
    SELECT id FROM quotes WHERE company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  ))
);

-- Create indexes for better performance
CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_date ON invoices(issue_date);
CREATE INDEX idx_quotes_company ON quotes(company_id);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_date ON quotes(issue_date);
CREATE INDEX idx_document_items_doc ON document_items(document_type, document_id);

-- Grant permissions
GRANT ALL ON clients TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON quotes TO authenticated;
GRANT ALL ON document_items TO authenticated;