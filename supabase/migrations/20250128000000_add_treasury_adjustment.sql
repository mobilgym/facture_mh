/*
  # Add treasury adjustment to companies table

  1. Changes
    - Add `treasury_adjustment` column to `companies` table
    - Default value is 0
    - Type is NUMERIC(15,2) to handle currency values with precision

  2. Purpose
    - Allow companies to add a manual adjustment to their calculated treasury
    - Helps reconcile calculated treasury with real-world bank balances
    - Persists across sessions and devices
*/

-- Add treasury_adjustment column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS treasury_adjustment NUMERIC(15,2) DEFAULT 0 NOT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN companies.treasury_adjustment IS 'Manual adjustment amount to reconcile calculated treasury with actual bank balance';
