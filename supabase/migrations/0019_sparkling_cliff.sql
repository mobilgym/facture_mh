-- Add amount column to files table
ALTER TABLE files
ADD COLUMN amount numeric(10,2);

-- Add index on amount column for better query performance
CREATE INDEX idx_files_amount ON files(amount);