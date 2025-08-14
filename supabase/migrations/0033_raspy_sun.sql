/*
  # Fix clients table and policies

  1. Drop and recreate clients table with proper structure
  2. Add proper RLS policies
  3. Add indexes for performance
*/

-- Drop and recreate clients table
DROP TABLE IF EXISTS clients CASCADE;

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

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Add indexes
CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_email ON clients(email);

-- Grant permissions
GRANT ALL ON clients TO authenticated;