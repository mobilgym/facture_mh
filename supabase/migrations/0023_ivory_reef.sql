-- Vérification et correction des permissions
GRANT ALL ON document_templates TO authenticated;
GRANT ALL ON company_settings TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON quotes TO authenticated;
GRANT ALL ON document_items TO authenticated;
GRANT ALL ON payment_terms TO authenticated;

-- Mise à jour des politiques RLS
DROP POLICY IF EXISTS "Users can manage their document templates" ON document_templates;
CREATE POLICY "Users can manage their document templates"
ON document_templates
USING (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Vérification de l'activation de RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_document_templates_company_type 
ON document_templates(company_id, type);