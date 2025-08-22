/*
  # Table de configuration des webhooks N8n
  
  1. Table
    - `webhook_configurations` : Configuration des webhooks par entreprise
    
  2. Colonnes
    - URL du webhook N8n
    - Méthode HTTP (POST/PUT)
    - Headers personnalisés (JSON)
    - État d'activation
    - Métadonnées (créé par, dates)
    
  3. Sécurité
    - RLS activé
    - Politiques basées sur l'entreprise de l'utilisateur
*/

-- Créer la table des configurations de webhooks
CREATE TABLE IF NOT EXISTS webhook_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  webhook_url text NOT NULL,
  http_method text NOT NULL DEFAULT 'POST' CHECK (http_method IN ('POST', 'PUT')),
  headers jsonb DEFAULT '{"Content-Type": "application/json"}'::jsonb,
  is_enabled boolean DEFAULT false,
  description text, -- Description optionnelle pour identifier le webhook
  last_tested_at timestamptz, -- Dernière fois que le webhook a été testé
  last_test_success boolean, -- Résultat du dernier test
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  -- Une seule configuration active par entreprise
  CONSTRAINT webhook_configurations_company_active_unique 
    EXCLUDE (company_id WITH =) WHERE (is_enabled = true)
);

-- Index pour la performance
CREATE INDEX idx_webhook_configurations_company_id ON webhook_configurations(company_id);
CREATE INDEX idx_webhook_configurations_enabled ON webhook_configurations(company_id, is_enabled) WHERE is_enabled = true;

-- Activer RLS
ALTER TABLE webhook_configurations ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Users can view their company webhook configurations"
  ON webhook_configurations FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert webhook configurations for their companies"
  ON webhook_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company webhook configurations"
  ON webhook_configurations FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
    AND updated_by = auth.uid()
  );

CREATE POLICY "Users can delete their company webhook configurations"
  ON webhook_configurations FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour automatiquement updated_at et updated_by
CREATE OR REPLACE FUNCTION update_webhook_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement les timestamps
CREATE TRIGGER update_webhook_configurations_updated_at
  BEFORE UPDATE ON webhook_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_configuration_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE webhook_configurations IS 'Configuration des webhooks N8n par entreprise pour l''extraction automatique de données';
COMMENT ON COLUMN webhook_configurations.webhook_url IS 'URL complète du webhook N8n (ex: https://n8n.example.com/webhook/extract-invoice)';
COMMENT ON COLUMN webhook_configurations.http_method IS 'Méthode HTTP à utiliser (POST ou PUT)';
COMMENT ON COLUMN webhook_configurations.headers IS 'Headers HTTP personnalisés au format JSON';
COMMENT ON COLUMN webhook_configurations.is_enabled IS 'Si true, ce webhook sera utilisé pour l''extraction';
COMMENT ON COLUMN webhook_configurations.description IS 'Description optionnelle du webhook (ex: "Extraction factures production")';
COMMENT ON COLUMN webhook_configurations.last_tested_at IS 'Date du dernier test de connexion';
COMMENT ON COLUMN webhook_configurations.last_test_success IS 'Résultat du dernier test (true = succès, false = échec)';

-- Insérer une configuration par défaut pour les entreprises existantes (optionnel)
INSERT INTO webhook_configurations (company_id, webhook_url, created_by, is_enabled)
SELECT 
  c.id as company_id,
  '' as webhook_url,
  (SELECT user_id FROM user_companies WHERE company_id = c.id LIMIT 1) as created_by,
  false as is_enabled
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM webhook_configurations wc WHERE wc.company_id = c.id
);
