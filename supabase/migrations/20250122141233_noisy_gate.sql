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

-- Create storage bucket for submitted invoices if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('submitted-invoices', 'submitted-invoices', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for submitted invoices
CREATE POLICY "Anyone can read submitted invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'submitted-invoices');

CREATE POLICY "Authenticated users can upload submitted invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submitted-invoices');