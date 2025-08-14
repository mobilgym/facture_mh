/*
  # Add clients table and relationships

  1. New Tables
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

  2. Security
    - Enable RLS on `clients` table
    - Add policy for authenticated users to manage their clients
    - Grant permissions to authenticated users

  3. Changes
    - Add client_id foreign key to invoices and quotes tables
    - Add indexes for performance optimization
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
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

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their clients"
ON clients
USING (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Add client_id to invoices and quotes
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);

ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);

-- Add indexes for relationships
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);

-- Grant permissions
GRANT ALL ON clients TO authenticated;