-- Migration pour le système de gestion de projets CSV
-- Permet de sauvegarder et reprendre le travail sur les fichiers CSV de lettrage

-- Table principale pour stocker les projets CSV
CREATE TABLE csv_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_date DATE NOT NULL, -- Date spécifique du projet
    csv_file_name VARCHAR(255) NOT NULL,
    csv_data TEXT NOT NULL, -- JSON stringifié des données CSV
    csv_headers TEXT[] NOT NULL, -- Array des en-têtes CSV
    column_mapping JSONB NOT NULL, -- Configuration des colonnes (date, montant, description)
    lettrage_state TEXT, -- JSON stringifié de l'état complet du lettrage
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_csv_projects_company_id ON csv_projects(company_id);
CREATE INDEX idx_csv_projects_created_by ON csv_projects(created_by);
CREATE INDEX idx_csv_projects_project_date ON csv_projects(project_date);
CREATE INDEX idx_csv_projects_is_completed ON csv_projects(is_completed);
CREATE INDEX idx_csv_projects_created_at ON csv_projects(created_at DESC);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_csv_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_csv_project_updated_at
    BEFORE UPDATE ON csv_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_csv_project_updated_at();

-- Politique de sécurité RLS
ALTER TABLE csv_projects ENABLE ROW LEVEL SECURITY;

-- Politique pour lire ses propres projets CSV de sa société
CREATE POLICY "Users can read own company csv projects" ON csv_projects
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Politique pour créer des projets CSV
CREATE POLICY "Users can create csv projects for own company" ON csv_projects
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Politique pour modifier ses propres projets CSV
CREATE POLICY "Users can update own csv projects" ON csv_projects
    FOR UPDATE USING (
        created_by = auth.uid()
        AND company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Politique pour supprimer ses propres projets CSV
CREATE POLICY "Users can delete own csv projects" ON csv_projects
    FOR DELETE USING (
        created_by = auth.uid()
        AND company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Vue pour faciliter les requêtes avec statistiques
CREATE VIEW csv_projects_with_stats AS
SELECT 
    cp.*,
    c.name as company_name,
    u.email as created_by_email,
    -- Calcul des statistiques à partir du lettrage_state JSON
    CASE 
        WHEN cp.lettrage_state IS NOT NULL AND cp.lettrage_state != '' THEN
            COALESCE((cp.lettrage_state::jsonb->'csvPayments')::jsonb->0->>'length', '0')::int
        ELSE 0
    END as total_payments,
    CASE 
        WHEN cp.lettrage_state IS NOT NULL AND cp.lettrage_state != '' THEN
            COALESCE(jsonb_array_length(COALESCE((cp.lettrage_state::jsonb->'matches')::jsonb, '[]'::jsonb)), 0)
        ELSE 0
    END as matched_count
FROM csv_projects cp
JOIN companies c ON cp.company_id = c.id
LEFT JOIN auth.users u ON cp.created_by = u.id;

-- Fonction pour obtenir les projets avec statistiques complètes
CREATE OR REPLACE FUNCTION get_csv_projects_list(p_company_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    project_date DATE,
    csv_file_name VARCHAR(255),
    is_completed BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    total_payments INTEGER,
    matched_count INTEGER,
    unmatched_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.name,
        cp.description,
        cp.project_date,
        cp.csv_file_name,
        cp.is_completed,
        cp.created_at,
        cp.updated_at,
        CASE 
            WHEN cp.lettrage_state IS NOT NULL AND cp.lettrage_state != '' THEN
                COALESCE(jsonb_array_length(COALESCE((cp.lettrage_state::jsonb->'csvPayments')::jsonb, '[]'::jsonb)), 0)
            ELSE 0
        END::INTEGER as total_payments,
        CASE 
            WHEN cp.lettrage_state IS NOT NULL AND cp.lettrage_state != '' THEN
                COALESCE(jsonb_array_length(COALESCE((cp.lettrage_state::jsonb->'matches')::jsonb, '[]'::jsonb)), 0)
            ELSE 0
        END::INTEGER as matched_count,
        CASE 
            WHEN cp.lettrage_state IS NOT NULL AND cp.lettrage_state != '' THEN
                COALESCE(jsonb_array_length(COALESCE((cp.lettrage_state::jsonb->'csvPayments')::jsonb, '[]'::jsonb)), 0) - 
                COALESCE(jsonb_array_length(COALESCE((cp.lettrage_state::jsonb->'matches')::jsonb, '[]'::jsonb)), 0)
            ELSE 0
        END::INTEGER as unmatched_count
    FROM csv_projects cp
    WHERE cp.company_id = p_company_id
    ORDER BY cp.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions sur la fonction
GRANT EXECUTE ON FUNCTION get_csv_projects_list(UUID) TO authenticated;
