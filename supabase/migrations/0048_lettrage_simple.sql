-- Migration simplifiée pour le système de lettrage
-- Évite les conflits de types et colonnes dupliquées

-- Supprimer les tables existantes si elles existent (pour un redémarrage propre)
DROP TABLE IF EXISTS lettrage_history CASCADE;
DROP TABLE IF EXISTS lettrage_matches CASCADE;
DROP VIEW IF EXISTS lettrage_detailed CASCADE;

-- Supprimer les colonnes de lettrage de la table files si elles existent
ALTER TABLE files 
DROP COLUMN IF EXISTS lettrage_match_id,
DROP COLUMN IF EXISTS is_lettree,
DROP COLUMN IF EXISTS lettrage_date;

-- Table principale pour stocker les correspondances de lettrage
CREATE TABLE lettrage_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    payment_id TEXT NOT NULL, -- ID du paiement CSV (données temporaires)
    invoice_amount DECIMAL(10,2) NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    difference DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_automatic BOOLEAN NOT NULL DEFAULT false,
    is_validated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_lettrage_matches_invoice_id ON lettrage_matches(invoice_id);
CREATE INDEX idx_lettrage_matches_company_id ON lettrage_matches(company_id);
CREATE INDEX idx_lettrage_matches_payment_id ON lettrage_matches(payment_id);
CREATE INDEX idx_lettrage_matches_validated ON lettrage_matches(is_validated);

-- Ajouter les colonnes de lettrage à la table files
ALTER TABLE files 
ADD COLUMN lettrage_match_id UUID REFERENCES lettrage_matches(id) ON DELETE SET NULL,
ADD COLUMN is_lettree BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN lettrage_date TIMESTAMPTZ;

-- Index pour les factures lettrées
CREATE INDEX idx_files_is_lettree ON files(is_lettree);
CREATE INDEX idx_files_lettrage_match_id ON files(lettrage_match_id);

-- Table pour l'historique des actions de lettrage (audit)
CREATE TABLE lettrage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'validated', 'cancelled', 'modified')),
    old_data JSONB,
    new_data JSONB,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE
);

-- Index pour l'historique
CREATE INDEX idx_lettrage_history_match_id ON lettrage_history(match_id);
CREATE INDEX idx_lettrage_history_company_id ON lettrage_history(company_id);
CREATE INDEX idx_lettrage_history_performed_at ON lettrage_history(performed_at);

-- Fonction pour calculer automatiquement la différence
CREATE OR REPLACE FUNCTION calculate_lettrage_difference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.difference = ABS(NEW.invoice_amount - NEW.payment_amount);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement la différence
CREATE TRIGGER trigger_calculate_lettrage_difference
    BEFORE INSERT OR UPDATE ON lettrage_matches
    FOR EACH ROW
    EXECUTE FUNCTION calculate_lettrage_difference();

-- Fonction pour mettre à jour automatiquement le statut de lettrage des factures
CREATE OR REPLACE FUNCTION update_file_lettrage_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Marquer la facture comme lettrée si le match est validé
        IF NEW.is_validated = true THEN
            UPDATE files 
            SET 
                lettrage_match_id = NEW.id,
                is_lettree = true,
                lettrage_date = NEW.validated_at
            WHERE id = NEW.invoice_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Démarquer la facture si le lettrage est supprimé
        UPDATE files 
        SET 
            lettrage_match_id = NULL,
            is_lettree = false,
            lettrage_date = NULL
        WHERE id = OLD.invoice_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le statut des factures
CREATE TRIGGER trigger_update_file_lettrage_status
    AFTER INSERT OR UPDATE OR DELETE ON lettrage_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_file_lettrage_status();

-- Vue pour faciliter les requêtes de lettrage avec détails complets
CREATE VIEW lettrage_detailed AS
SELECT 
    lm.id,
    lm.invoice_id,
    lm.payment_id,
    lm.invoice_amount,
    lm.payment_amount,
    lm.difference,
    lm.is_automatic,
    lm.is_validated,
    lm.created_at,
    lm.validated_at,
    lm.created_by,
    lm.company_id,
    f.name as invoice_name,
    f.document_date as invoice_date,
    f.created_by as invoice_created_by,
    c.name as company_name
FROM lettrage_matches lm
JOIN files f ON lm.invoice_id = f.id
JOIN companies c ON lm.company_id = c.id;

-- Politique de sécurité RLS pour lettrage_matches
ALTER TABLE lettrage_matches ENABLE ROW LEVEL SECURITY;

-- Politique pour lire ses propres lettrages
CREATE POLICY "Users can read own company lettrage matches" ON lettrage_matches
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Politique pour créer des lettrages
CREATE POLICY "Users can create lettrage matches for own company" ON lettrage_matches
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Politique pour modifier ses lettrages
CREATE POLICY "Users can update own company lettrage matches" ON lettrage_matches
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Politique pour supprimer ses lettrages
CREATE POLICY "Users can delete own company lettrage matches" ON lettrage_matches
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Politique de sécurité RLS pour lettrage_history
ALTER TABLE lettrage_history ENABLE ROW LEVEL SECURITY;

-- Politique pour lire l'historique de sa société
CREATE POLICY "Users can read own company lettrage history" ON lettrage_history
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Commentaires pour la documentation
COMMENT ON TABLE lettrage_matches IS 'Table des correspondances de lettrage entre factures et paiements CSV';
COMMENT ON TABLE lettrage_history IS 'Historique des actions de lettrage pour audit';
COMMENT ON COLUMN lettrage_matches.payment_id IS 'ID du paiement CSV (données temporaires, pas de FK)';
COMMENT ON COLUMN lettrage_matches.difference IS 'Différence absolue entre montant facture et paiement';
COMMENT ON COLUMN lettrage_matches.is_automatic IS 'True si correspondance trouvée automatiquement';
COMMENT ON COLUMN lettrage_matches.is_validated IS 'True si lettrage validé par utilisateur';
COMMENT ON COLUMN files.is_lettree IS 'True si facture a été lettrée avec un paiement';
COMMENT ON COLUMN files.lettrage_date IS 'Date de validation du lettrage';
