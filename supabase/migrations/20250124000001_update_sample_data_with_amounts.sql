-- Update existing submitted invoices with sample amounts for testing
UPDATE submitted_invoices 
SET amount = CASE 
  WHEN file_name LIKE '%frais de mission%' THEN 
    ROUND((RANDOM() * 500 + 50)::numeric, 2)
  WHEN file_name LIKE '%service%' THEN 
    ROUND((RANDOM() * 200 + 20)::numeric, 2)
  ELSE 
    ROUND((RANDOM() * 1000 + 100)::numeric, 2)
END
WHERE amount IS NULL;

-- Add comment to explain the update
COMMENT ON TABLE submitted_invoices IS 'Table contenant les factures soumises avec montants et métadonnées associées';