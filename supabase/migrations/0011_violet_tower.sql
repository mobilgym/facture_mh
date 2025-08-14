/*
  # Add document date to files table
  
  1. Changes
    - Add document_date column to files table
    - Set default value to current timestamp
    - Backfill existing records
*/

-- Add document_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'document_date'
  ) THEN
    ALTER TABLE files ADD COLUMN document_date timestamptz DEFAULT now();
    
    -- Update existing records
    UPDATE files SET document_date = created_at WHERE document_date IS NULL;
    
    -- Make the column required
    ALTER TABLE files ALTER COLUMN document_date SET NOT NULL;
  END IF;
END $$;