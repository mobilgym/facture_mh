/*
  # Create Submitted Invoices Table

  1. New Tables
    - `submitted_invoices`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `organization` (text)
      - `email` (text)
      - `document_date` (timestamptz)
      - `file_url` (text)
      - `file_name` (text)
      - `file_size` (bigint)
      - `year` (text)
      - `month` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Create indexes for performance
*/

-- Create submitted_invoices table
CREATE TABLE submitted_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  organization text NOT NULL,
  email text NOT NULL,
  document_date timestamptz NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  year text NOT NULL,
  month text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE submitted_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view submitted invoices"
ON submitted_invoices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create submitted invoices"
ON submitted_invoices FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_submitted_invoices_year_month 
ON submitted_invoices(year, month);

CREATE INDEX idx_submitted_invoices_date 
ON submitted_invoices(document_date);

CREATE INDEX idx_submitted_invoices_organization 
ON submitted_invoices(organization);

CREATE INDEX idx_submitted_invoices_email 
ON submitted_invoices(email);

CREATE INDEX idx_submitted_invoices_name 
ON submitted_invoices(last_name, first_name);

-- Grant permissions
GRANT ALL ON submitted_invoices TO authenticated;

-- Insert test data
INSERT INTO submitted_invoices (
  first_name,
  last_name,
  organization,
  email,
  document_date,
  file_url,
  file_name,
  file_size,
  year,
  month
) VALUES
  (
    'Jean',
    'Dupont',
    'MOBILGYM',
    'jean.dupont@example.com',
    '2024-01-15 10:00:00',
    'https://example.com/facture1.pdf',
    'facture1.pdf',
    1024576,
    '2024',
    '01'
  ),
  (
    'Marie',
    'Martin',
    'MOBILGYM',
    'marie.martin@example.com',
    '2024-01-20 14:30:00',
    'https://example.com/facture2.pdf',
    'facture2.pdf',
    2048576,
    '2024',
    '01'
  ),
  (
    'Pierre',
    'Durand',
    'MOBILGYM',
    'pierre.durand@example.com',
    '2024-02-05 09:15:00',
    'https://example.com/facture3.pdf',
    'facture3.pdf',
    1536576,
    '2024',
    '02'
  );