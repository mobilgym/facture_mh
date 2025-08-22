/**
 * Script de démonstration du nouveau système OCR amélioré
 * Montre les capacités d'extraction et de génération de noms de fichiers
 */

import { enhancedDocumentAnalyzer } from './enhancedDocumentAnalyzer';
import { DocumentType } from '@/components/files/TypeSelectionDialog';

// Exemples de textes extraits de différents types de documents
export const SAMPLE_DOCUMENTS = {
  facture_mcdo: {
    text: `
    McDonald's Châtelet
    123 Rue de Rivoli
    75001 PARIS
    
    FACTURE N° FAC-2024-0156
    Date: 15/01/2024
    
    Commande:
    - Big Mac Menu      12.50€
    - Coca-Cola         2.80€
    - Frites            3.20€
    
    Total TTC: 18.50€
    TVA 20%: 3.08€
    
    Mode de paiement: CB
    `,
    type: 'purchase' as DocumentType,
    expectedExtraction: {
      company: 'McDonald\'s',
      amount: 18.50,
      fileName: 'Ach_mcdonalds.pdf'
    }
  },

  facture_sarl: {
    text: `
    ENTREPRISE MARTIN SARL
    Capital social: 10 000€
    SIRET: 123 456 789 00012
    
    FACTURE N° 2024-001
    Date d'émission: 28 février 2024
    Date d'échéance: 30 mars 2024
    
    Prestations:
    - Conseil informatique  450.00€
    - Formation             280.00€
    - Support technique     170.00€
    
    Total HT: 900.00€
    TVA 20%: 180.00€
    Net à payer: 1080.00€
    
    Règlement par virement bancaire
    `,
    type: 'sale' as DocumentType,
    expectedExtraction: {
      company: 'ENTREPRISE MARTIN',
      amount: 1080.00,
      fileName: 'Vte_entreprise_martin.pdf'
    }
  },

  ticket_carrefour: {
    text: `
    CARREFOUR MARKET
    Centre Commercial des Lilas
    93260 LES LILAS
    
    TICKET DE CAISSE
    15/01/2024 14:32
    Caisse 03 - Opérateur: Sophie
    
    ARTICLES:
    Pain de mie         2.45€
    Lait 1L            1.35€
    Yaourts x8         3.20€
    Bananes 1kg        2.68€
    
    Total: 9.68€
    Payé par CB: 9.68€
    
    Merci de votre visite!
    `,
    type: 'purchase' as DocumentType,
    expectedExtraction: {
      company: 'CARREFOUR',
      amount: 9.68,
      fileName: 'Ach_carrefour.pdf'
    }
  },

  ticket_cb: {
    text: `
    TERMINAL DE PAIEMENT
    CREDIT AGRICOLE
    
    SHELL STATION SERVICE
    Autoroute A6 - Aire de Nemours
    
    TRANSACTION CB
    Date: 15/01/2024
    Heure: 16:45:32
    
    Montant: 65.40€
    Type: DÉBIT
    Carte: ****1234
    
    APPROUVÉ
    Code autorisation: 123456
    
    Conservez ce ticket
    `,
    type: 'purchase' as DocumentType,
    expectedExtraction: {
      company: 'SHELL',
      amount: 65.40,
      fileName: 'Ach_shell.pdf'
    }
  }
};

/**
 * Fonction de démonstration pour tester l'extraction sur des exemples
 */
export async function demonstrateOCRCapabilities(): Promise<void> {
  console.log('🚀 Démonstration des capacités OCR améliorées\n');

  for (const [docName, docData] of Object.entries(SAMPLE_DOCUMENTS)) {
    console.log(`\n📄 Test document: ${docName.toUpperCase()}`);
    console.log('=' .repeat(50));
    
    try {
      // Simuler l'extraction depuis le texte (normalement ce serait depuis un fichier)
      const extractedData = await simulateExtraction(docData.text, docData.type);
      
      console.log('✅ Données extraites:');
      console.log(`   🏢 Entreprise: ${extractedData.companyName || 'Non détectée'}`);
      console.log(`   📅 Date: ${extractedData.date ? extractedData.date.toLocaleDateString('fr-FR') : 'Non détectée'}`);
      console.log(`   💰 Montant: ${extractedData.amount ? extractedData.amount.toFixed(2) + '€' : 'Non détecté'}`);
      console.log(`   📁 Nom fichier: ${extractedData.fileName}`);
      
      if (extractedData.confidence) {
        console.log('📊 Niveaux de confiance:');
        console.log(`   🏢 Entreprise: ${extractedData.confidence.companyName}%`);
        console.log(`   📅 Date: ${extractedData.confidence.date}%`);
        console.log(`   💰 Montant: ${extractedData.confidence.amount}%`);
      }

      // Vérification des attentes
      const expected = docData.expectedExtraction;
      console.log('\n🎯 Vérification des attentes:');
      
      if (extractedData.companyName?.includes(expected.company)) {
        console.log(`   ✅ Entreprise: ${extractedData.companyName} contient "${expected.company}"`);
      } else {
        console.log(`   ❌ Entreprise: Attendu "${expected.company}", obtenu "${extractedData.companyName}"`);
      }
      
      if (Math.abs((extractedData.amount || 0) - expected.amount) < 0.01) {
        console.log(`   ✅ Montant: ${extractedData.amount}€ = ${expected.amount}€`);
      } else {
        console.log(`   ❌ Montant: Attendu ${expected.amount}€, obtenu ${extractedData.amount}€`);
      }
      
      if (extractedData.fileName === expected.fileName) {
        console.log(`   ✅ Nom fichier: ${extractedData.fileName}`);
      } else {
        console.log(`   ⚠️  Nom fichier: Attendu "${expected.fileName}", obtenu "${extractedData.fileName}"`);
      }

    } catch (error) {
      console.error(`❌ Erreur lors du test ${docName}:`, error);
    }
  }

  console.log('\n🏁 Démonstration terminée!');
}

/**
 * Simule l'extraction de données depuis un texte
 * (Dans la réalité, ceci serait fait par l'OCR sur un fichier image/PDF)
 */
async function simulateExtraction(text: string, documentType: DocumentType) {
  // Simulation des méthodes privées d'extraction
  
  // Extraction entreprise
  const companyResult = extractCompanyFromText(text);
  
  // Extraction date
  const dateResult = extractDateFromText(text);
  
  // Extraction montant
  const amountResult = extractAmountFromText(text);
  
  // Génération nom de fichier
  const fileName = generateFileNameFromData(companyResult?.name, documentType);
  
  return {
    companyName: companyResult?.name,
    date: dateResult?.date,
    amount: amountResult?.amount,
    fileName,
    confidence: {
      companyName: companyResult?.confidence || 0,
      date: dateResult?.confidence || 0,
      amount: amountResult?.confidence || 0
    }
  };
}

function extractCompanyFromText(text: string): { name: string; confidence: number } | null {
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
}

function extractDateFromText(text: string): { date: Date; confidence: number } | null {
  const datePatterns = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
    /\b(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})\b/gi,
  ];

  const monthNames = {
    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
    'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12,
  };

  let bestDate = null;
  let highestConfidence = 0;

  for (let i = 0; i < datePatterns.length; i++) {
    const pattern = datePatterns[i];
    const matches = [...text.matchAll(pattern)];
    
    for (const match of matches) {
      let day: number, month: number, year: number;
      let confidence = 50;

      if (i === 0) { // DD/MM/YYYY
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
      } else { // DD Mois YYYY
        day = parseInt(match[1]);
        month = monthNames[match[2].toLowerCase() as keyof typeof monthNames] || 0;
        year = parseInt(match[3]);
        confidence += 20;
      }

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2030) {
        const date = new Date(year, month - 1, day);
        const now = new Date();
        const diffDays = Math.abs((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 365) confidence += 20;
        
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestDate = date;
        }
      }
    }
  }

  return bestDate ? { date: bestDate, confidence: highestConfidence } : null;
}

function extractAmountFromText(text: string): { amount: number; confidence: number } | null {
  const amountPatterns = [
    /(?:total\s+ttc|net\s+à\s+payer|total\s+general|montant\s+total)\s*:?\s*(\d+[,.]?\d*)\s*€?/gi,
    /total\s*:?\s*(\d+[,.]?\d*)\s*€/gi,
    /(\d+[,.]?\d*)\s*€/g,
  ];

  let bestAmount = null;
  let highestConfidence = 0;

  for (let i = 0; i < amountPatterns.length; i++) {
    const pattern = amountPatterns[i];
    const matches = [...text.matchAll(pattern)];
    
    for (const match of matches) {
      const amountStr = match[1].replace(',', '.');
      const amount = parseFloat(amountStr);
      
      if (!isNaN(amount) && amount > 0 && amount < 10000) {
        let confidence = 30 + (2 - i) * 20;
        if (amount >= 5 && amount <= 1000) confidence += 20;
        if (match[1].includes(',')) confidence += 10;
        
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestAmount = amount;
        }
      }
    }
  }

  return bestAmount ? { amount: bestAmount, confidence: highestConfidence } : null;
}

function generateFileNameFromData(companyName: string | undefined, documentType: DocumentType): string {
  const prefix = documentType === 'purchase' ? 'Ach_' : 'Vte_';
  
  if (!companyName) {
    return `${prefix}document.pdf`;
  }

  const cleanName = companyName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, 20);

  return `${prefix}${cleanName}.pdf`;
}

// Export pour utilisation dans la console de développement
(window as any).demoOCR = demonstrateOCRCapabilities;
