-- Store validated matches as JSON to persist validation state
ALTER TABLE rapprochements
  ADD COLUMN IF NOT EXISTS matches_data JSONB DEFAULT '[]'::jsonb;
