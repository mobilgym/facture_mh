-- Add transactions_data column to store AI-parsed transactions as JSON
ALTER TABLE rapprochements
  ADD COLUMN IF NOT EXISTS transactions_data JSONB DEFAULT '[]'::jsonb;
