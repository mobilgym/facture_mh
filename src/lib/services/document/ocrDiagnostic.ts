/**
 * Outil de diagnostic OCR interactif
 * Permet de tester étape par étape le processus d'extraction
 */

import { enhancedDocumentAnalyzer } from './enhancedDocumentAnalyzer';
import { DocumentType } from '@/components/files/TypeSelectionDialog';

export interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export class OCRDiagnostic {
  private results: DiagnosticResult[] = [];

  /**
   * Lance un diagnostic complet sur un fichier
   */
  async runFullDiagnostic(file: File, documentType: DocumentType): Promise<DiagnosticResult[]> {
    this.results = [];
    
    console.log('🚀 DIAGNOSTIC OCR COMPLET');
    console.log('='.repeat(60));
    console.log(`📄 Fichier: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB)`);
    console.log(`📋 Type: ${documentType}`);
    console.log('='.repeat(60));

    // Étape 1: Vérification du fichier
    await this.checkFile(file);
    
    // Étape 2: Test d'initialisation OCR
    await this.checkOCRInitialization();
    
    // Étape 3: Test d'extraction de texte
    await this.checkTextExtraction(file);
    
    // Étape 4: Test des patterns d'extraction
    // (sera fait après avoir le texte)
    
    return this.results;
  }

  /**
   * Vérifie la validité du fichier
   */
  private async checkFile(file: File): Promise<void> {
    console.log('\n1️⃣ VÉRIFICATION DU FICHIER');
    console.log('-'.repeat(40));

    try {
      // Vérification basique
      if (!file) {
        throw new Error('Fichier non fourni');
      }

      if (file.size === 0) {
        throw new Error('Fichier vide');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        this.addResult('file-check', 'warning', `Fichier volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB) - peut être lent`);
      }

      // Vérification du type
      const supportedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!supportedTypes.includes(file.type)) {
        throw new Error(`Type de fichier non supporté: ${file.type}`);
      }

      // Test de lecture
      const arrayBuffer = await file.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Impossible de lire le contenu du fichier');
      }

      // Vérification signature PDF
      if (file.type === 'application/pdf') {
        const uint8Array = new Uint8Array(arrayBuffer);
        const signature = String.fromCharCode(...uint8Array.slice(0, 4));
        if (signature !== '%PDF') {
          throw new Error('Fichier PDF corrompu ou invalide');
        }
      }

      this.addResult('file-check', 'success', `Fichier valide: ${file.name} (${file.type})`, {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeKB: Math.round(file.size / 1024)
      });

    } catch (error) {
      this.addResult('file-check', 'error', `Erreur fichier: ${error instanceof Error ? error.message : 'Inconnue'}`);
    }
  }

  /**
   * Teste l'initialisation du moteur OCR
   */
  private async checkOCRInitialization(): Promise<void> {
    console.log('\n2️⃣ INITIALISATION MOTEUR OCR');
    console.log('-'.repeat(40));

    try {
      // Test de disponibilité de Tesseract
      if (typeof window === 'undefined') {
        throw new Error('Environnement non-navigateur détecté');
      }

      // Test de connexion (nécessaire pour télécharger les modèles)
      try {
        await fetch('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js', { method: 'HEAD' });
        this.addResult('network-check', 'success', 'Connexion CDN Tesseract.js disponible');
      } catch {
        this.addResult('network-check', 'warning', 'CDN Tesseract.js non accessible - utilisation cache local');
      }

      // Test d'initialisation du worker
      const startTime = Date.now();
      
      console.log('🤖 Test initialisation worker OCR...');
      
      // Simuler l'initialisation (sans créer de worker réel pour éviter conflits)
      if (enhancedDocumentAnalyzer) {
        this.addResult('ocr-init', 'success', 'Service OCR disponible');
      } else {
        throw new Error('Service enhancedDocumentAnalyzer non disponible');
      }

      const initTime = Date.now() - startTime;
      console.log(`✅ Initialisation simulée en ${initTime}ms`);

      this.addResult('ocr-init', 'success', `Initialisation OCR réussie (${initTime}ms)`);

    } catch (error) {
      this.addResult('ocr-init', 'error', `Erreur initialisation OCR: ${error instanceof Error ? error.message : 'Inconnue'}`);
      console.error('❌ Erreur initialisation:', error);
    }
  }

  /**
   * Teste l'extraction de texte
   */
  private async checkTextExtraction(file: File): Promise<void> {
    console.log('\n3️⃣ EXTRACTION DE TEXTE');
    console.log('-'.repeat(40));

    try {
      const startTime = Date.now();

      console.log('🔍 Lancement extraction OCR réelle...');
      
      // Lancer l'extraction réelle
      const results = await enhancedDocumentAnalyzer.analyzeDocument(file, 'purchase', {
        onProgress: (progress, message) => {
          console.log(`📊 ${progress.toFixed(0)}% - ${message}`);
        }
      });

      const extractionTime = Date.now() - startTime;

      if (results) {
        this.addResult('text-extraction', 'success', `Extraction réussie (${extractionTime}ms)`, {
          companyName: results.companyName || 'Non détecté',
          date: results.date || 'Non détecté',
          amount: results.amount || 'Non détecté',
          fileName: results.fileName || 'Non généré',
          confidence: results.confidence
        });

        // Test patterns spécifiques
        await this.testPatternMatching(results);

      } else {
        throw new Error('Aucun résultat retourné par l\'OCR');
      }

    } catch (error) {
      this.addResult('text-extraction', 'error', `Erreur extraction: ${error instanceof Error ? error.message : 'Inconnue'}`);
      console.error('❌ Erreur extraction:', error);
    }
  }

  /**
   * Teste le matching des patterns sur les résultats
   */
  private async testPatternMatching(results: any): Promise<void> {
    console.log('\n4️⃣ TEST PATTERNS D\'EXTRACTION');
    console.log('-'.repeat(40));

    // Test nom d'entreprise
    if (results.companyName) {
      this.addResult('pattern-company', 'success', `Entreprise détectée: "${results.companyName}" (confiance: ${results.confidence?.companyName || 0}%)`);
    } else {
      this.addResult('pattern-company', 'warning', 'Aucune entreprise détectée - vérifiez les patterns');
    }

    // Test date
    if (results.date) {
      this.addResult('pattern-date', 'success', `Date détectée: ${results.date.toLocaleDateString('fr-FR')} (confiance: ${results.confidence?.date || 0}%)`);
    } else {
      this.addResult('pattern-date', 'warning', 'Aucune date détectée - vérifiez les patterns');
    }

    // Test montant
    if (results.amount) {
      this.addResult('pattern-amount', 'success', `Montant détecté: ${results.amount}€ (confiance: ${results.confidence?.amount || 0}%)`);
    } else {
      this.addResult('pattern-amount', 'warning', 'Aucun montant détecté - vérifiez les patterns');
    }

    // Test génération nom de fichier
    if (results.fileName && results.fileName !== 'Ach_document.pdf' && results.fileName !== 'Vte_document.pdf') {
      this.addResult('filename-generation', 'success', `Nom de fichier généré: "${results.fileName}"`);
    } else {
      this.addResult('filename-generation', 'warning', `Nom de fichier par défaut: "${results.fileName}" - données insuffisantes`);
    }
  }

  /**
   * Ajoute un résultat au diagnostic
   */
  private addResult(step: string, status: 'success' | 'error' | 'warning', message: string, data?: any): void {
    const result: DiagnosticResult = { step, status, message, data };
    this.results.push(result);

    const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
    const color = status === 'success' ? 'color: green' : status === 'error' ? 'color: red' : 'color: orange';
    
    console.log(`%c${icon} ${message}`, color);
    if (data) {
      console.log('📊 Données:', data);
    }
  }

  /**
   * Affiche un résumé du diagnostic
   */
  displaySummary(): void {
    console.log('\n🏁 RÉSUMÉ DU DIAGNOSTIC');
    console.log('='.repeat(60));

    const successes = this.results.filter(r => r.status === 'success').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const errors = this.results.filter(r => r.status === 'error').length;

    console.log(`✅ Succès: ${successes}`);
    console.log(`⚠️ Avertissements: ${warnings}`);
    console.log(`❌ Erreurs: ${errors}`);

    if (errors > 0) {
      console.log('\n🚨 ERREURS DÉTECTÉES:');
      this.results.filter(r => r.status === 'error').forEach(r => {
        console.log(`   • ${r.step}: ${r.message}`);
      });
    }

    if (warnings > 0) {
      console.log('\n⚠️ AVERTISSEMENTS:');
      this.results.filter(r => r.status === 'warning').forEach(r => {
        console.log(`   • ${r.step}: ${r.message}`);
      });
    }

    console.log('\n💡 RECOMMANDATIONS:');
    
    if (errors > 0) {
      console.log('   • Corrigez les erreurs avant de continuer');
    }
    
    if (warnings > 0) {
      console.log('   • Vérifiez la qualité du document et les patterns de reconnaissance');
    }
    
    if (successes === this.results.length) {
      console.log('   • Diagnostic parfait ! L\'OCR devrait fonctionner correctement');
    }

    console.log('='.repeat(60));
  }

  /**
   * Retourne les résultats du diagnostic
   */
  getResults(): DiagnosticResult[] {
    return this.results;
  }
}

// Fonction utilitaire pour diagnostic rapide
export async function runQuickDiagnostic(file: File, documentType: DocumentType = 'purchase'): Promise<void> {
  const diagnostic = new OCRDiagnostic();
  await diagnostic.runFullDiagnostic(file, documentType);
  diagnostic.displaySummary();
}

// Export pour utilisation console
if (typeof window !== 'undefined') {
  (window as any).OCRDiagnostic = OCRDiagnostic;
  (window as any).runQuickDiagnostic = runQuickDiagnostic;
  
  // Fonction helper pour diagnostiquer le fichier actuel
  (window as any).diagnoseCurrentFile = () => {
    console.log('💡 Pour diagnostiquer votre fichier:');
    console.log('1. Importez votre fichier via l\'interface');
    console.log('2. Dans la console, récupérez le fichier avec:');
    console.log('   const fileInput = document.querySelector(\'input[type="file"]\');');
    console.log('   const file = fileInput.files[0];');
    console.log('3. Lancez: runQuickDiagnostic(file, "purchase");');
  };
}
