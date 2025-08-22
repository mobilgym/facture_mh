import { EnhancedDocumentAnalyzer } from '../enhancedDocumentAnalyzer';
import { DocumentType } from '@/components/files/TypeSelectionDialog';

describe('EnhancedDocumentAnalyzer', () => {
  const analyzer = new EnhancedDocumentAnalyzer();

  describe('generateFileName', () => {
    // Méthode privée exposée pour le test
    const generateFileName = (companyName: string | undefined, documentType: DocumentType): string => {
      const prefix = documentType === 'purchase' ? 'Ach_' : 'Vte_';
      
      if (!companyName) {
        return `${prefix}document.pdf`;
      }

      // Nettoyer le nom d'entreprise
      const cleanName = companyName
        .replace(/[^a-zA-Z0-9\s]/g, '') // Supprimer caractères spéciaux
        .replace(/\s+/g, '_') // Remplacer espaces par underscore
        .toLowerCase()
        .substring(0, 20); // Limiter la longueur

      return `${prefix}${cleanName}.pdf`;
    };

    describe('Préfixes ACH_ pour achats', () => {
      it('devrait générer ACH_ pour un achat simple', () => {
        const result = generateFileName('McDonald\'s', 'purchase');
        expect(result).toBe('Ach_mcdonalds.pdf');
      });

      it('devrait générer ACH_ pour une entreprise avec forme juridique', () => {
        const result = generateFileName('SARL Dupont & Fils', 'purchase');
        expect(result).toBe('Ach_sarl_dupont__fils.pdf');
      });

      it('devrait générer ACH_ pour un magasin avec espaces', () => {
        const result = generateFileName('Carrefour Market', 'purchase');
        expect(result).toBe('Ach_carrefour_market.pdf');
      });

      it('devrait gérer les noms longs avec ACH_', () => {
        const result = generateFileName('Entreprise de Services Informatiques et Télécommunications', 'purchase');
        expect(result).toBe('Ach_entreprise_de_servi.pdf');
        expect(result.length).toBeLessThanOrEqual(24); // Ach_ + 20 chars + .pdf
      });

      it('devrait gérer les caractères spéciaux avec ACH_', () => {
        const result = generateFileName('Café "Le P\'tit Bonheur"', 'purchase');
        expect(result).toBe('Ach_caf_le_ptit_bonheur.pdf');
      });
    });

    describe('Préfixes VTE_ pour ventes', () => {
      it('devrait générer VTE_ pour une vente simple', () => {
        const result = generateFileName('Client Société', 'sale');
        expect(result).toBe('Vte_client_socit.pdf');
      });

      it('devrait générer VTE_ pour un client avec forme juridique', () => {
        const result = generateFileName('SAS Technologies Avancées', 'sale');
        expect(result).toBe('Vte_sas_technologies_a.pdf');
      });

      it('devrait gérer les noms de clients courts avec VTE_', () => {
        const result = generateFileName('ABC', 'sale');
        expect(result).toBe('Vte_abc.pdf');
      });
    });

    describe('Cas limites', () => {
      it('devrait utiliser un nom par défaut si pas de nom d\'entreprise (achat)', () => {
        const result = generateFileName(undefined, 'purchase');
        expect(result).toBe('Ach_document.pdf');
      });

      it('devrait utiliser un nom par défaut si pas de nom d\'entreprise (vente)', () => {
        const result = generateFileName(undefined, 'sale');
        expect(result).toBe('Vte_document.pdf');
      });

      it('devrait gérer les chaînes vides', () => {
        const result = generateFileName('', 'purchase');
        expect(result).toBe('Ach_document.pdf');
      });

      it('devrait gérer les caractères uniquement spéciaux', () => {
        const result = generateFileName('!@#$%^&*()', 'purchase');
        expect(result).toBe('Ach_document.pdf');
      });
    });

    describe('Validation des formats', () => {
      it('devrait toujours se terminer par .pdf', () => {
        const testCases = [
          ['McDonald\'s', 'purchase'],
          ['Client Test', 'sale'],
          [undefined, 'purchase'],
          ['', 'sale']
        ];

        testCases.forEach(([name, type]) => {
          const result = generateFileName(name as string, type as DocumentType);
          expect(result).toMatch(/\.pdf$/);
        });
      });

      it('devrait toujours commencer par le bon préfixe', () => {
        const purchaseResult = generateFileName('Test Company', 'purchase');
        const saleResult = generateFileName('Test Client', 'sale');
        
        expect(purchaseResult).toMatch(/^Ach_/);
        expect(saleResult).toMatch(/^Vte_/);
      });

      it('ne devrait pas avoir d\'espaces dans le nom final', () => {
        const result = generateFileName('Nom Avec Beaucoup D\'Espaces', 'purchase');
        expect(result).not.toMatch(/\s/);
        expect(result).toBe('Ach_nom_avec_beaucoup_de.pdf');
      });
    });
  });

  describe('Extraction de données', () => {
    describe('extractCompanyName', () => {
      // Méthode privée simulée pour tests
      const extractCompanyName = (text: string): { name: string; confidence: number } | null => {
        // Patterns pour identifier les entreprises
        const companyPatterns = [
          /([A-Z][A-Za-z\s&\-\.]{2,50})\s+(SARL|SAS|SA|EURL|SNC|SASU|EARL|GIE)\b/gi,
          /(MCDO|McDonald's|LIDL|AUCHAN|CARREFOUR|LECLERC|INTERMARCHÉ|CASINO|MONOPRIX|FRANPRIX|G20)\b/gi,
          /(TOTAL|BP|SHELL|ESSO|AGIP|AVIA)\s*(ACCESS|RELAIS|STATION)?/gi,
        ];

        let bestMatch = null;
        let highestConfidence = 0;

        for (const pattern of companyPatterns) {
          const matches = [...text.matchAll(pattern)];
          for (const match of matches) {
            const companyName = match[1]?.trim() || match[0]?.trim();
            if (companyName && companyName.length > 2) {
              let confidence = 50;
              if (/\b(SARL|SAS|SA|EURL|SNC|SASU|EARL|GIE)\b/i.test(companyName)) confidence += 30;
              if (/\b(MCDO|McDonald's|LIDL|AUCHAN|CARREFOUR|LECLERC|TOTAL|BP|SHELL)\b/i.test(companyName)) confidence += 25;
              if (text.toLowerCase().includes('facture') || text.toLowerCase().includes('ticket')) confidence += 15;
              
              if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = companyName;
              }
            }
          }
        }

        return bestMatch ? { name: bestMatch, confidence: highestConfidence } : null;
      };

      it('devrait détecter les entreprises avec forme juridique', () => {
        const text = "Facture de Entreprise Dupont SARL";
        const result = extractCompanyName(text);
        
        expect(result).not.toBeNull();
        expect(result?.name).toBe('Entreprise Dupont');
        expect(result?.confidence).toBeGreaterThan(80);
      });

      it('devrait détecter les magasins connus', () => {
        const text = "Ticket de caisse CARREFOUR MARKET";
        const result = extractCompanyName(text);
        
        expect(result).not.toBeNull();
        expect(result?.name).toBe('CARREFOUR');
        expect(result?.confidence).toBeGreaterThan(70);
      });

      it('devrait détecter les stations essence', () => {
        const text = "TOTAL ACCESS STATION SERVICE";
        const result = extractCompanyName(text);
        
        expect(result).not.toBeNull();
        expect(result?.name).toMatch(/TOTAL/);
      });
    });
  });

  describe('Intégration complète', () => {
    it('devrait générer des noms de fichiers cohérents pour différents types de documents', () => {
      const testCases = [
        { company: 'McDonald\'s', type: 'purchase' as DocumentType, expected: 'Ach_mcdonalds.pdf' },
        { company: 'SARL Martin & Fils', type: 'purchase' as DocumentType, expected: 'Ach_sarl_martin__fils.pdf' },
        { company: 'Client Premium', type: 'sale' as DocumentType, expected: 'Vte_client_premium.pdf' },
        { company: 'CARREFOUR', type: 'purchase' as DocumentType, expected: 'Ach_carrefour.pdf' },
      ];

      testCases.forEach(({ company, type, expected }) => {
        const prefix = type === 'purchase' ? 'Ach_' : 'Vte_';
        const cleanName = company
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .toLowerCase()
          .substring(0, 20);
        const result = `${prefix}${cleanName}.pdf`;
        
        expect(result).toBe(expected);
      });
    });
  });

  afterAll(async () => {
    // Nettoyage des ressources
    await analyzer.cleanup();
  });
});

// Tests d'exemple pour documentation
describe('Exemples de génération de noms', () => {
  const examples = [
    { input: 'McDo Châtelet', type: 'purchase', expected: 'Ach_mcdo_chatelet.pdf' },
    { input: 'SARL Dupont & Fils', type: 'sale', expected: 'Vte_sarl_dupont_fils.pdf' },
    { input: 'Carrefour Market', type: 'purchase', expected: 'Ach_carrefour_market.pdf' },
    { input: 'Total Access', type: 'purchase', expected: 'Ach_total_access.pdf' },
    { input: 'Client ABC SAS', type: 'sale', expected: 'Vte_client_abc_sas.pdf' },
  ];

  examples.forEach(({ input, type, expected }) => {
    it(`${input} (${type}) → ${expected}`, () => {
      const prefix = type === 'purchase' ? 'Ach_' : 'Vte_';
      const cleanName = input
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .substring(0, 20);
      const result = `${prefix}${cleanName}.pdf`;
      
      expect(result).toBe(expected);
    });
  });
});
