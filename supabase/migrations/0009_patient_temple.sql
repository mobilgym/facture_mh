/*
  # Add document date to files table

  1. Changes
    - Add document_date column to files table
    - Set default value to current timestamp
    - Backfill existing rows
    
  2. Notes
    - The document_date represents when the document was created/issued
    - Different from created_at which tracks when the file was uploaded
*/

-- Add document_date column
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS document_date timestamptz DEFAULT now();

-- Update existing rows to use created_at as document_date
UPDATE files 
SET document_date = created_at 
WHERE document_date IS NULL;

-- Make document_date required
ALTER TABLE files 
ALTER COLUMN document_date SET NOT NULL;