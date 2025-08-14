/*
  # Recreate clients table

  1. Tables
    - `clients`: Stores client information
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `address` (text, optional)
      - `siret` (text, optional)
      - `vat_number` (text, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Grant permissions to authenticated users

  3. Performance
    - Add indexes for common queries
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS clients CASCADE;

-- Create clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
DO $$ BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their company clients" ON clients;
  DROP POLICY IF EXISTS "Users can create clients" ON clients;
  DROP POLICY IF EXISTS "Users can update their company clients" ON clients;
  DROP POLICY IF EXISTS "Users can delete their company clients" ON clients;
END $$;

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

CREATE POLICY "Users can create clients"
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Grant permissions
GRANT ALL ON clients TO authenticated;