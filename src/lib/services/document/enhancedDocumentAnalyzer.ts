import Tesseract from 'tesseract.js';
import { DocumentType } from '@/components/files/TypeSelectionDialog';
import { 
  DocumentAnalysisError, 
  OCRInitializationError, 
  DocumentConversionError, 
  TextExtractionError,
  DocumentParsingError,
  ErrorHandler 
} from './documentAnalysisError';

export interface ExtractedDocumentData {
  companyName?: string;
  date?: Date;
  amount?: number;
  fileName?: string;
  confidence?: {
    companyName: number;
    date: number;
    amount: number;
  };
}

interface AnalysisProgress {
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Service d'analyse automatique de documents amélioré avec Tesseract.js optimisé
 */
export class EnhancedDocumentAnalyzer {
  private worker: Tesseract.Worker | null = null;

  /**
   * Initialise le worker OCR avec configuration optimisée
   */
  private async initializeWorker(): Promise<void> {
    if (this.worker) return;

    try {
      console.log('🤖 Initialisation du moteur OCR avancé...');
      this.worker = await Tesseract.createWorker(['fra', 'eng'], 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      // Configuration avancée pour améliorer la précision
      await this.worker.setParameters({
        tessedit_page_seg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüÿ€.,/()-:; ',
        preserve_interword_spaces: '1',
      });

      console.log('✅ Moteur OCR avancé initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation OCR:', error);
      throw new OCRInitializationError(`Impossible d'initialiser le moteur OCR: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Convertit un fichier PDF en image haute qualité pour l'OCR
   */
  private async pdfToImage(file: File): Promise<HTMLCanvasElement> {
    return new Promise(async (resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async () => {
        try {
          console.log('📄 Conversion PDF en image haute résolution...');
          const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
          
          // Utiliser PDF.js pour un rendu de haute qualité
          const pdfjsLib = await import('pdfjs-dist');
          
          // Configuration du worker PDF.js
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          const page = await pdf.getPage(1); // Première page
          
          // Calculer la mise à l'échelle pour haute résolution
          const scale = 2.0; // Facteur d'échelle pour améliorer la qualité OCR
          const viewport = page.getViewport({ scale });
          
          // Créer le canvas
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new DocumentConversionError('Impossible de créer le contexte canvas');
          }
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Pré-traitement pour améliorer l'OCR
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          // Rendu de la page PDF
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
          
          // Post-traitement pour optimiser l'OCR
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          this.preprocessImageForOCR(imageData);
          context.putImageData(imageData, 0, 0);
          
          console.log('✅ PDF converti en image haute qualité');
          resolve(canvas);
          
        } catch (error) {
          console.error('❌ Erreur lors de la conversion PDF:', error);
          const conversionError = new DocumentConversionError(
            `Impossible de convertir le PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
          );
          reject(conversionError);
        }
      };

      fileReader.onerror = () => {
        reject(new DocumentConversionError('Erreur lors de la lecture du fichier PDF'));
      };

      fileReader.readAsArrayBuffer(file);
    });
  }

  /**
   * Pré-traite une image pour améliorer la reconnaissance OCR
   */
  private preprocessImageForOCR(imageData: ImageData): void {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Conversion en niveaux de gris
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      // Amélioration du contraste (seuillage adaptatif)
      const threshold = 128;
      const newValue = gray > threshold ? 255 : 0;
      
      data[i] = newValue;     // Red
      data[i + 1] = newValue; // Green
      data[i + 2] = newValue; // Blue
      // Alpha reste inchangé
    }
  }

  /**
   * Préprocess une image (non-PDF) pour l'OCR
   */
  private async preprocessImage(file: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new DocumentConversionError('Impossible de créer le contexte canvas'));
          return;
        }

        // Redimensionner pour une meilleure qualité OCR
        const maxWidth = 1600;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Appliquer le préprocessing
        const imageData = ctx.getImageData(0, 0, width, height);
        this.preprocessImageForOCR(imageData);
        ctx.putImageData(imageData, 0, 0);
        
        resolve(canvas);
      };
      
      img.onerror = () => {
        reject(new DocumentConversionError('Erreur lors du chargement de l\'image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Extrait le texte d'une image ou d'un PDF avec OCR amélioré
   */
  private async extractText(file: File, options?: AnalysisProgress): Promise<string> {
    try {
      await this.initializeWorker();
      
      options?.onProgress?.(10, 'Préparation du document...');

      let imageSource: HTMLCanvasElement;

      // Traitement selon le type de fichier
      if (file.type === 'application/pdf') {
        options?.onProgress?.(30, 'Conversion PDF haute qualité...');
        imageSource = await this.pdfToImage(file);
      } else {
        options?.onProgress?.(30, 'Préprocessing image...');
        imageSource = await this.preprocessImage(file);
      }

      options?.onProgress?.(50, 'Analyse OCR avancée en cours...');

      // Effectuer l'OCR
      if (!this.worker) {
        throw new OCRInitializationError('Worker OCR non initialisé');
      }

      try {
        const { data: { text, confidence } } = await this.worker.recognize(imageSource);
        
        options?.onProgress?.(90, 'Traitement du texte...');
        
        if (!text || text.trim().length === 0) {
          throw new TextExtractionError('Aucun texte détecté dans le document');
        }
        
        console.log('📄 Texte extrait par OCR (confiance:', Math.round(confidence), '%):');
        console.log(text.substring(0, 500) + '...');
        
        return text;
      } catch (error) {
        if (error instanceof TextExtractionError) {
          throw error;
        }
        throw new TextExtractionError(`Erreur OCR: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction de texte:', error);
      
      if (error instanceof DocumentAnalysisError) {
        throw error;
      }
      
      throw new TextExtractionError(`Impossible d'extraire le texte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Extrait intelligemment le nom d'entreprise du texte
   */
  private extractCompanyName(text: string): { name: string; confidence: number } | null {
    console.log('🏢 Extraction du nom d\'entreprise...');
    
    // Patterns pour identifier les entreprises
    const companyPatterns = [
      // Noms en début de document (factureurs français)
      /^([A-Z][A-Za-z\s\-\.]{3,40})\s*$/gm,
      // Noms complets avec formes juridiques françaises  
      /([A-Z][A-Za-z\s&\-\.]{2,50})\s+(SARL|SAS|SA|EURL|SNC|SASU|EARL|GIE)\b/gi,
      // Entreprises avec "Société"
      /Société\s+([A-Za-z\s&\-\.]{3,50})/gi,
      // Entreprises avec "Entreprise"
      /Entreprise\s+([A-Za-z\s&\-\.]{3,50})/gi,
      // Professions libérales (pattern pour noms comme "Amandine LE GOAREGUER")
      /([A-Z][a-z]+\s+[A-Z]{2,}\s+[A-Z][A-Z\s]{2,})/g,
      // Magasins connus
      /(MCDO|McDonald's|LIDL|AUCHAN|CARREFOUR|LECLERC|INTERMARCHÉ|CASINO|MONOPRIX|FRANPRIX|G20)\b/gi,
      // Stations essence
      /(TOTAL|BP|SHELL|ESSO|AGIP|AVIA)\s*(ACCESS|RELAIS|STATION)?/gi,
      // Pattern général pour noms d'entreprise
      /([A-Z][A-Za-z\s]{2,30})\s+(?=.*(?:facture|ticket|reçu))/gi
    ];

    let bestMatch = null;
    let highestConfidence = 0;

    for (const pattern of companyPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const companyName = match[1]?.trim() || match[0]?.trim();
        if (companyName && companyName.length > 2) {
          const confidence = this.calculateNameConfidence(companyName, text);
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = companyName;
          }
        }
      }
    }

    return bestMatch ? { name: bestMatch, confidence: highestConfidence } : null;
  }

  /**
   * Calcule le niveau de confiance pour un nom d'entreprise
   */
  private calculateNameConfidence(name: string, fullText: string): number {
    let confidence = 50; // Base
    
    // Bonus si contient une forme juridique
    if (/\b(SARL|SAS|SA|EURL|SNC|SASU|EARL|GIE)\b/i.test(name)) confidence += 30;
    
    // Bonus si magasin connu
    if (/\b(MCDO|McDonald's|LIDL|AUCHAN|CARREFOUR|LECLERC|TOTAL|BP|SHELL)\b/i.test(name)) confidence += 25;
    
    // Bonus pour noms avec prénoms et noms de famille (professions libérales)
    if (/^[A-Z][a-z]+\s+[A-Z]{2,}/.test(name)) confidence += 20;
    
    // Bonus si près de mots-clés français
    if (fullText.toLowerCase().includes('facture') || fullText.toLowerCase().includes('ticket')) confidence += 15;
    if (fullText.toLowerCase().includes('sport') || fullText.toLowerCase().includes('santé')) confidence += 10;
    
    // Bonus si en début de document (première ligne)
    const lines = fullText.split('\n').filter(line => line.trim().length > 3);
    if (lines.length > 0 && lines[0].includes(name)) confidence += 20;
    
    // Malus si trop court ou trop long
    if (name.length < 3) confidence -= 20;
    if (name.length > 40) confidence -= 15;
    
    return Math.min(Math.max(confidence, 0), 100);
  }

  /**
   * Extrait intelligemment les dates du texte
   */
  private extractDate(text: string): { date: Date; confidence: number } | null {
    console.log('📅 Extraction de la date...');
    
    const datePatterns = [
      // Format français DD/MM/YYYY
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
      // Format DD/MM/YY
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/g,
      // Format YYYY-MM-DD
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,
      // Format DD Mois YYYY (français)
      /\b(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})\b/gi,
      // Format DD Mon YYYY (anglais)
      /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})\b/gi
    ];

    const monthNames = {
      'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
      'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12,
      'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
      'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    };

    let bestDate = null;
    let highestConfidence = 0;

    for (let i = 0; i < datePatterns.length; i++) {
      const pattern = datePatterns[i];
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches) {
        let day: number, month: number, year: number;
        let confidence = 50;

        if (i <= 2) { // Formats numériques
          if (i === 0 || i === 1) { // DD/MM/YYYY ou DD/MM/YY
            day = parseInt(match[1]);
            month = parseInt(match[2]);
            year = parseInt(match[3]);
            if (year < 100) year += 2000; // Conversion YY vers YYYY
          } else { // YYYY-MM-DD
            year = parseInt(match[1]);
            month = parseInt(match[2]);
            day = parseInt(match[3]);
          }
        } else { // Formats avec noms de mois
          day = parseInt(match[1]);
          month = monthNames[match[2].toLowerCase()] || 0;
          year = parseInt(match[3]);
          confidence += 20; // Bonus pour format textuel
        }

        // Validation de la date
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2030) {
          const date = new Date(year, month - 1, day);
          
          // Bonus si date récente
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

  /**
   * Extrait intelligemment les montants du texte
   */
  private extractAmount(text: string): { amount: number; confidence: number } | null {
    console.log('💰 Extraction du montant...');
    
    const amountPatterns = [
      // Priorité 1: Total TTC, Net à payer
      /(?:total\s+ttc|net\s+à\s+payer|total\s+general|montant\s+total)\s*:?\s*(\d+[,.]?\d*)\s*€?/gi,
      // Priorité 2: Total
      /total\s*:?\s*(\d+[,.]?\d*)\s*€/gi,
      // Priorité 3: Montants français avec € (format "120,00 €")
      /(\d+,\d{2})\s*€/g,
      // Priorité 4: Montants avec € (format général)
      /(\d+[,.]?\d*)\s*€/g,
      // Priorité 5: Montants en fin de ligne (comme "120,00 €" isolé)
      /(\d+,\d{2})\s*€?\s*$/gm,
      // Priorité 6: Pattern général pour montants
      /(?:montant|prix|somme)\s*:?\s*(\d+[,.]?\d*)/gi
    ];

    let bestAmount = null;
    let highestConfidence = 0;

    for (let i = 0; i < amountPatterns.length; i++) {
      const pattern = amountPatterns[i];
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches) {
        const amountStr = match[1].replace(',', '.');
        const amount = parseFloat(amountStr);
        
        if (!isNaN(amount) && amount > 0 && amount < 10000) { // Limite raisonnable
          let confidence = 30 + (3 - i) * 20; // Plus de confiance pour les priorités élevées
          
          // Bonus pour montants réalistes
          if (amount >= 5 && amount <= 1000) confidence += 20;
          
          // Bonus si format français avec virgule
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

  /**
   * Génère un nom de fichier intelligent avec préfixes ACH_/VTE_
   */
  private generateFileName(companyName: string | undefined, documentType: DocumentType): string {
    console.log('📝 Génération du nom de fichier...');
    
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
  }

  /**
   * Analyse complète d'un document avec extraction intelligente
   */
  async analyzeDocument(
    file: File, 
    documentType: DocumentType,
    options?: AnalysisProgress
  ): Promise<ExtractedDocumentData> {
    console.log('🔍 Début de l\'analyse intelligente du document...');
    
    try {
      options?.onProgress?.(5, 'Initialisation de l\'analyse...');
      
      // Extraction du texte avec OCR amélioré
      const text = await this.extractText(file, {
        onProgress: (progress, message) => {
          options?.onProgress?.(5 + (progress * 0.6), message);
        }
      });

      options?.onProgress?.(70, 'Analyse intelligente des données...');

      // Debug: afficher le texte extrait pour diagnostic
      console.log('📝 Texte extrait par OCR (complet):');
      console.log('='.repeat(50));
      console.log(text);
      console.log('='.repeat(50));

      // Extraction intelligente des informations
      const companyResult = this.extractCompanyName(text);
      const dateResult = this.extractDate(text);
      const amountResult = this.extractAmount(text);

      options?.onProgress?.(90, 'Génération des résultats...');

      // Génération du nom de fichier
      const fileName = this.generateFileName(companyResult?.name, documentType);

      const results: ExtractedDocumentData = {
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

      options?.onProgress?.(100, 'Analyse terminée !');

      console.log('✅ Analyse intelligente terminée:', results);
      return results;

    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse du document:', error);
      
      if (error instanceof DocumentAnalysisError) {
        throw error;
      }
      
      throw new DocumentParsingError(`Erreur lors de l'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Nettoie les ressources
   */
  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('🧹 Worker OCR nettoyé');
    }
  }
}

// Instance singleton
export const enhancedDocumentAnalyzer = new EnhancedDocumentAnalyzer();

// Export pour outils de diagnostic
if (typeof window !== 'undefined') {
  (window as any).enhancedDocumentAnalyzer = enhancedDocumentAnalyzer;
}
