/*
  # Fix Companies Permissions and Add Missing Indexes

  1. Security
    - Fix RLS policies for companies table
    - Add proper permissions for authenticated users
    - Ensure proper cascading deletes

  2. Performance
    - Add indexes for better query performance
    - Optimize company-related queries
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Companies Policy" ON companies;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON companies;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON companies;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON companies;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON companies;

-- Create new optimized policies
CREATE POLICY "companies_select_policy" 
ON companies FOR SELECT 
TO authenticated 
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "companies_insert_policy" 
ON companies FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "companies_update_policy" 
ON companies FOR UPDATE 
TO authenticated 
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "companies_delete_policy" 
ON companies FOR DELETE 
TO authenticated 
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- Ensure RLS is enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- Grant proper permissions
GRANT ALL ON companies TO authenticated;
GRANT ALL ON user_companies TO authenticated;