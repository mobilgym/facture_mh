/*
  # Migration vers accès global des webhooks N8n
  
  1. Suppression des restrictions par entreprise
  2. Simplification des politiques RLS
  3. Configuration partagée globalement
*/

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can view their company webhook configurations" ON webhook_configurations;
DROP POLICY IF EXISTS "Users can insert webhook configurations for their companies" ON webhook_configurations;
DROP POLICY IF EXISTS "Users can update their company webhook configurations" ON webhook_configurations;
DROP POLICY IF EXISTS "Users can delete their company webhook configurations" ON webhook_configurations;

-- Supprimer la contrainte d'unicité par entreprise
ALTER TABLE webhook_configurations DROP CONSTRAINT IF EXISTS webhook_configurations_company_active_unique;

-- Modifier la table pour rendre company_id optionnel
ALTER TABLE webhook_configurations ALTER COLUMN company_id DROP NOT NULL;

-- Nouvelle contrainte : une seule configuration active globalement
ALTER TABLE webhook_configurations ADD CONSTRAINT webhook_configurations_global_active_unique 
  EXCLUDE (is_enabled WITH =) WHERE (is_enabled = true);

-- Nouvelles politiques RLS simplifiées - accès global pour tous les utilisateurs authentifiés
CREATE POLICY "All authenticated users can view webhook configurations"
  ON webhook_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can insert webhook configurations"
  ON webhook_configurations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "All authenticated users can update webhook configurations"
  ON webhook_configurations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (updated_by = auth.uid());

CREATE POLICY "All authenticated users can delete webhook configurations"
  ON webhook_configurations FOR DELETE
  TO authenticated
  USING (true);

-- Supprimer les index liés aux entreprises
DROP INDEX IF EXISTS idx_webhook_configurations_company_id;
DROP INDEX IF EXISTS idx_webhook_configurations_enabled;

-- Nouveau index pour la configuration active globale
CREATE INDEX idx_webhook_configurations_global_enabled ON webhook_configurations(is_enabled) WHERE is_enabled = true;

-- Mettre à jour les commentaires
COMMENT ON TABLE webhook_configurations IS 'Configuration globale des webhooks N8n pour l''extraction automatique de données';
COMMENT ON COLUMN webhook_configurations.company_id IS 'ID de l''entreprise (optionnel, peut être NULL pour configuration globale)';

-- Consolider les configurations existantes vers une configuration globale
-- Prendre la première configuration active trouvée
DO $$
DECLARE
    active_config RECORD;
    config_count INTEGER;
BEGIN
    -- Compter les configurations actives
    SELECT COUNT(*) INTO config_count 
    FROM webhook_configurations 
    WHERE is_enabled = true;
    
    IF config_count > 1 THEN
        -- S'il y a plusieurs configurations actives, garder seulement la première
        SELECT * INTO active_config 
        FROM webhook_configurations 
        WHERE is_enabled = true 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        -- Désactiver toutes les autres
        UPDATE webhook_configurations 
        SET is_enabled = false 
        WHERE is_enabled = true 
        AND id != active_config.id;
        
        RAISE NOTICE 'Consolidation terminée. Configuration active conservée: %', active_config.id;
    END IF;
END $$;
