-- Add amount column to submitted_invoices table
ALTER TABLE submitted_invoices 
ADD COLUMN amount numeric(15,2);

-- Add comment to describe the column
COMMENT ON COLUMN submitted_invoices.amount IS 'Montant de la facture en euros';

-- Create index for amount for better search performance
CREATE INDEX idx_submitted_invoices_amount 
ON submitted_invoices(amount) 
WHERE amount IS NOT NULL;