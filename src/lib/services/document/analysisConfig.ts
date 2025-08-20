/**
 * Configuration de l'analyse de documents
 */

export interface AnalysisConfig {
  // Configuration OCR
  ocr: {
    language: string;
    engineMode: number;
    pageSegMode: number;
  };
  
  // Configuration d'extraction
  extraction: {
    // Seuils de confiance
    confidenceThresholds: {
      companyName: number;
      date: number;
      amount: number;
    };
    
    // Patterns de recherche prioritaires
    priorityPatterns: {
      companyName: RegExp[];
      date: RegExp[];
      amount: RegExp[];
    };
    
    // Mots-clés contextuels
    contextKeywords: {
      invoice: string[];
      amount: string[];
      date: string[];
      company: string[];
    };
  };
  
  // Configuration de performance
  performance: {
    maxFileSize: number; // en bytes
    timeout: number; // en ms
    maxRetries: number;
  };
}

/**
 * Configuration par défaut
 */
export const defaultConfig: AnalysisConfig = {
  ocr: {
    language: 'fra',
    engineMode: 1, // Neural networks LSTM engine only
    pageSegMode: 1  // Automatic page segmentation with OSD
  },
  
  extraction: {
    confidenceThresholds: {
      companyName: 0.3,
      date: 0.6,
      amount: 0.5
    },
    
    priorityPatterns: {
      companyName: [
        // Sociétés avec formes juridiques
        /([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß\s&-]+(?:S\.?A\.?S\.?|SARL|SAS|SA|EURL|SCI|SASU|SNC|SEL))/gi,
        // Marques connues
        /(?:^|\s)(McDonald'?s?|McDo|Quick|Burger King|KFC|Carrefour|Leclerc|Apple|Amazon|Google)/gi,
        // Patterns génériques
        /([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß\s&'-]{2,30})/g
      ],
      
      date: [
        // Dates françaises avec mots
        /(?:du\s+)?(\d{1,2})(?:er)?\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/gi,
        // Formats numériques
        /(?:le\s+)?(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
        /(?:le\s+)?(\d{1,2})-(\d{1,2})-(\d{4})/g,
        // Format ISO
        /(\d{4})-(\d{1,2})-(\d{1,2})/g
      ],
      
      amount: [
        // Total TTC (priorité maximale)
        /(?:total\s+ttc|net\s+à\s+payer|montant\s+total)\s*:?\s*([0-9\s.,]+)\s*€?/gi,
        // Autres totaux
        /(?:total|montant|somme)\s*:?\s*([0-9\s.,]+)\s*€/gi,
        // Montants avec €
        /([0-9\s.,]+)\s*€/g
      ]
    },
    
    contextKeywords: {
      invoice: ['facture', 'invoice', 'bill', 'note', 'ticket', 'reçu', 'quittance'],
      amount: ['total', 'ttc', 'ht', 'montant', 'prix', 'somme', 'net à payer', 'à payer'],
      date: ['date', 'émission', 'établi', 'du', 'le', 'émis'],
      company: ['société', 'entreprise', 'sarl', 'sas', 'sa', 'eurl', 'sci', 'auto-entrepreneur']
    }
  },
  
  performance: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    timeout: 60000, // 1 minute
    maxRetries: 2
  }
};

/**
 * Configuration spécialisée pour les factures d'achat
 */
export const purchaseInvoiceConfig: Partial<AnalysisConfig> = {
  extraction: {
    contextKeywords: {
      invoice: ['facture', 'bill', 'receipt', 'ticket de caisse', 'note'],
      amount: ['total ttc', 'net à payer', 'total', 'montant dû'],
      date: ['date facture', 'émis le', 'du'],
      company: ['vendeur', 'fournisseur', 'magasin', 'enseigne']
    },
    
    priorityPatterns: {
      amount: [
        // Prioriser les montants de facture d'achat
        /(?:total\s+ttc|net\s+à\s+payer|total\s+dû)\s*:?\s*([0-9\s.,]+)\s*€?/gi,
        /(?:montant\s+total|total)\s*:?\s*([0-9\s.,]+)\s*€/gi,
        /([0-9\s.,]+)\s*€\s*(?:ttc|total)?/gi
      ]
    }
  }
};

/**
 * Configuration spécialisée pour les factures de vente
 */
export const salesInvoiceConfig: Partial<AnalysisConfig> = {
  extraction: {
    contextKeywords: {
      invoice: ['facture de vente', 'invoice', 'devis', 'commande'],
      amount: ['total ht', 'total ttc', 'montant facturé', 'à encaisser'],
      date: ['date facture', 'facturé le', 'établi le'],
      company: ['client', 'acheteur', 'destinataire']
    },
    
    priorityPatterns: {
      amount: [
        // Prioriser les montants de facture de vente
        /(?:total\s+ttc|montant\s+facturé|à\s+encaisser)\s*:?\s*([0-9\s.,]+)\s*€?/gi,
        /(?:total\s+ht|sous-total)\s*:?\s*([0-9\s.,]+)\s*€/gi,
        /([0-9\s.,]+)\s*€\s*(?:ttc|ht)?/gi
      ]
    }
  }
};

/**
 * Fusionne une configuration partielle avec la configuration par défaut
 */
export function mergeConfig(baseConfig: AnalysisConfig, override: Partial<AnalysisConfig>): AnalysisConfig {
  return {
    ocr: { ...baseConfig.ocr, ...override.ocr },
    extraction: {
      confidenceThresholds: { 
        ...baseConfig.extraction.confidenceThresholds, 
        ...override.extraction?.confidenceThresholds 
      },
      priorityPatterns: { 
        ...baseConfig.extraction.priorityPatterns, 
        ...override.extraction?.priorityPatterns 
      },
      contextKeywords: { 
        ...baseConfig.extraction.contextKeywords, 
        ...override.extraction?.contextKeywords 
      }
    },
    performance: { ...baseConfig.performance, ...override.performance }
  };
}

/**
 * Obtient la configuration optimale selon le type de document
 */
export function getConfigForDocumentType(documentType: 'achat' | 'vente'): AnalysisConfig {
  switch (documentType) {
    case 'achat':
      return mergeConfig(defaultConfig, purchaseInvoiceConfig);
    case 'vente':
      return mergeConfig(defaultConfig, salesInvoiceConfig);
    default:
      return defaultConfig;
  }
}
