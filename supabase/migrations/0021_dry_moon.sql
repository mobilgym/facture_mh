-- Drop existing foreign key constraint
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_category_id_fkey;

-- Modify category_id to be text instead of UUID
ALTER TABLE files ALTER COLUMN category_id TYPE text;

-- Add back the foreign key constraint
ALTER TABLE files
ADD CONSTRAINT files_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES document_categories(id)
ON DELETE SET NULL;

-- Update existing policies
CREATE POLICY "Users can view files in their categories"
ON files FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);