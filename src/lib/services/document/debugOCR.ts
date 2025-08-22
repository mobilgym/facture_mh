/**
 * Script de debug pour tester l'OCR sur des exemples de texte
 * Simule le comportement de l'OCR sur le document de l'image
 */

// Simulation du texte extrait de la facture visible dans l'image
const SAMPLE_FACTURE_TEXT = `
Amandine LE GOAREGUER
8 rue de la candoule
13460 Saintes Maries de la Mer
Téléphone 06 87 32 21 44
Mail: amandine.le@sportmedical@hotmail.com

N° SIRET 524 402 344 00021

FACTURE SPORT SANTE
2025

N° DE FACTURE 20250101
DATE : 21/08/2025

A : MGHGYM
8 RUE GEORGES COURTELINE
33400 TALENCE
Téléphone 05 56 30 22 11 46
Mail: mghgym@hotmail.com

DESCRIPTION                 NB DE SEANCES    TAUX HORAIRE    MONTANT
Séance Sport Santé sous prescription médicale (16-17-20-27)    4    30    120,00 €

Règlement accepté : Espèces - Chèques - Virement

RIB 30003 01510 00050406724 37
IBAN FR76 3000 3015 1000 0504 0672 437
BIC : SOGEFRPP

Si chèques, veuillez rédiger à l'ordre d'Amandine LE GOAREGUER
Total dû dans un délai de 15 jours.
Non assujetti à la TVA

NOUS VOUS REMERCIONS DE VOTRE CONFIANCE.
`;

/**
 * Test les patterns d'extraction sur le texte de la facture
 */
export function testOCRPatterns(): void {
  console.log('🧪 Test des patterns OCR sur la facture Amandine LE GOAREGUER');
  console.log('='.repeat(60));
  
  // Test extraction nom d'entreprise
  console.log('\n🏢 Test extraction nom d\'entreprise:');
  
  const companyPatterns = [
    { name: 'Début de document', pattern: /^([A-Z][A-Za-z\s\-\.]{3,40})\s*$/gm },
    { name: 'Profession libérale', pattern: /([A-Z][a-z]+\s+[A-Z]{2,}\s+[A-Z][A-Z\s]{2,})/g },
    { name: 'Forme juridique', pattern: /([A-Z][A-Za-z\s&\-\.]{2,50})\s+(SARL|SAS|SA|EURL|SNC|SASU|EARL|GIE)\b/gi },
  ];
  
  companyPatterns.forEach(({ name, pattern }) => {
    const matches = [...SAMPLE_FACTURE_TEXT.matchAll(pattern)];
    console.log(`  ${name}:`);
    matches.forEach((match, index) => {
      console.log(`    ${index + 1}. "${match[1] || match[0]}"`);
    });
    if (matches.length === 0) console.log('    Aucun résultat');
  });
  
  // Test extraction date
  console.log('\n📅 Test extraction date:');
  
  const datePatterns = [
    { name: 'DD/MM/YYYY', pattern: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g },
    { name: 'Mot-clé DATE', pattern: /DATE\s*:\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi },
  ];
  
  datePatterns.forEach(({ name, pattern }) => {
    const matches = [...SAMPLE_FACTURE_TEXT.matchAll(pattern)];
    console.log(`  ${name}:`);
    matches.forEach((match, index) => {
      if (name === 'Mot-clé DATE') {
        console.log(`    ${index + 1}. ${match[1]}/${match[2]}/${match[3]}`);
      } else {
        console.log(`    ${index + 1}. ${match[1]}/${match[2]}/${match[3]}`);
      }
    });
    if (matches.length === 0) console.log('    Aucun résultat');
  });
  
  // Test extraction montant
  console.log('\n💰 Test extraction montant:');
  
  const amountPatterns = [
    { name: 'Format français X,XX €', pattern: /(\d+,\d{2})\s*€/g },
    { name: 'Montant avec €', pattern: /(\d+[,.]?\d*)\s*€/g },
    { name: 'Total/Montant', pattern: /(?:total|montant)\s*:?\s*(\d+[,.]?\d*)\s*€?/gi },
    { name: 'Fin de ligne', pattern: /(\d+,\d{2})\s*€?\s*$/gm },
  ];
  
  amountPatterns.forEach(({ name, pattern }) => {
    const matches = [...SAMPLE_FACTURE_TEXT.matchAll(pattern)];
    console.log(`  ${name}:`);
    matches.forEach((match, index) => {
      const amount = parseFloat(match[1].replace(',', '.'));
      console.log(`    ${index + 1}. "${match[1]}" → ${amount}€`);
    });
    if (matches.length === 0) console.log('    Aucun résultat');
  });
  
  // Test génération nom de fichier
  console.log('\n📁 Test génération nom de fichier:');
  
  function generateFileName(companyName: string | undefined, documentType: 'purchase' | 'sale'): string {
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
  
  const testCompanies = [
    'Amandine LE GOAREGUER',
    'SPORT SANTE',
    'Amandine',
    undefined
  ];
  
  testCompanies.forEach(company => {
    const achatFile = generateFileName(company, 'purchase');
    const venteFile = generateFileName(company, 'sale');
    console.log(`  "${company || 'undefined'}":`);
    console.log(`    Achat: ${achatFile}`);
    console.log(`    Vente: ${venteFile}`);
  });
  
  console.log('\n✅ Test terminé!');
}

/**
 * Fonction pour simuler l'extraction complète
 */
export function simulateFullExtraction(): void {
  console.log('🔍 Simulation extraction complète sur facture Amandine LE GOAREGUER');
  console.log('='.repeat(60));
  
  // Extraction entreprise
  const companyMatch = SAMPLE_FACTURE_TEXT.match(/^([A-Z][A-Za-z\s\-\.]{3,40})\s*$/gm);
  const companyName = companyMatch ? companyMatch[0].trim() : null;
  
  // Extraction date
  const dateMatch = SAMPLE_FACTURE_TEXT.match(/DATE\s*:\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i);
  const extractedDate = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : null;
  
  // Extraction montant
  const amountMatch = SAMPLE_FACTURE_TEXT.match(/(\d+,\d{2})\s*€/);
  const extractedAmount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;
  
  // Génération nom de fichier
  function generateFileName(companyName: string | null): string {
    if (!companyName) return 'Ach_document.pdf';
    
    const cleanName = companyName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 20);
    
    return `Ach_${cleanName}.pdf`;
  }
  
  const fileName = generateFileName(companyName);
  
  console.log('📊 Résultats d\'extraction:');
  console.log(`  🏢 Entreprise: ${companyName || 'Non détectée'}`);
  console.log(`  📅 Date: ${extractedDate || 'Non détectée'}`);
  console.log(`  💰 Montant: ${extractedAmount ? extractedAmount + '€' : 'Non détecté'}`);
  console.log(`  📁 Nom fichier: ${fileName}`);
  
  // Calcul niveaux de confiance
  console.log('\n📈 Niveaux de confiance estimés:');
  console.log(`  🏢 Entreprise: ${companyName ? '85%' : '0%'} ${companyName ? '🟢' : '🔴'}`);
  console.log(`  📅 Date: ${extractedDate ? '90%' : '0%'} ${extractedDate ? '🟢' : '🔴'}`);
  console.log(`  💰 Montant: ${extractedAmount ? '95%' : '0%'} ${extractedAmount ? '🟢' : '🔴'}`);
}

// Export pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).testOCRPatterns = testOCRPatterns;
  (window as any).simulateFullExtraction = simulateFullExtraction;
}
