-- Create rapprochements table for bank reconciliation
CREATE TABLE IF NOT EXISTS rapprochements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year TEXT NOT NULL,
  month TEXT NOT NULL,
  pdf_file_name TEXT NOT NULL,
  total_transactions INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  unmatched_count INTEGER DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  matched_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'complete')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ
);

-- Index for fast lookups by company and period
CREATE INDEX idx_rapprochements_company_period
  ON rapprochements(company_id, year, month);

-- Enable RLS
ALTER TABLE rapprochements ENABLE ROW LEVEL SECURITY;

-- Policy: users can manage rapprochements for their companies
CREATE POLICY "Users can manage rapprochements for their companies"
  ON rapprochements
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );
