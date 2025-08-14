/*
  # Fix clients table and permissions

  1. Drop existing table and recreate
    - Drop existing clients table if exists
    - Create new clients table with proper structure
    - Add all necessary indexes
    - Set up proper relationships

  2. Security
    - Enable RLS
    - Add comprehensive policies
    - Grant proper permissions

  3. Changes
    - Ensure clean state for clients table
    - Fix relationships with invoices and quotes
*/

-- Drop existing table and relationships
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

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "Users can view their company clients"
ON clients FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create clients for their companies"
ON clients FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their company clients"
ON clients FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company clients"
ON clients FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_created_at ON clients(created_at);

-- Update invoices and quotes relationships
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_client_id_fkey,
ADD CONSTRAINT invoices_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE quotes 
DROP CONSTRAINT IF EXISTS quotes_client_id_fkey,
ADD CONSTRAINT quotes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Grant permissions
GRANT ALL ON clients TO authenticated;