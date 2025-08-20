/**
 * Erreurs spécifiques à l'analyse de documents
 */
export class DocumentAnalysisError extends Error {
  public readonly code: string;
  public readonly recoverable: boolean;

  constructor(message: string, code: string = 'ANALYSIS_ERROR', recoverable: boolean = true) {
    super(message);
    this.name = 'DocumentAnalysisError';
    this.code = code;
    this.recoverable = recoverable;

    // Maintenir la stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocumentAnalysisError);
    }
  }
}

export class OCRInitializationError extends DocumentAnalysisError {
  constructor(message: string = 'Impossible d\'initialiser le moteur OCR') {
    super(message, 'OCR_INIT_ERROR', true);
  }
}

export class DocumentConversionError extends DocumentAnalysisError {
  constructor(message: string = 'Erreur lors de la conversion du document') {
    super(message, 'CONVERSION_ERROR', true);
  }
}

export class TextExtractionError extends DocumentAnalysisError {
  constructor(message: string = 'Erreur lors de l\'extraction du texte') {
    super(message, 'TEXT_EXTRACTION_ERROR', true);
  }
}

export class DocumentParsingError extends DocumentAnalysisError {
  constructor(message: string = 'Erreur lors de l\'analyse du contenu') {
    super(message, 'PARSING_ERROR', false);
  }
}

/**
 * Utilitaires pour la gestion d'erreurs
 */
export class ErrorHandler {
  /**
   * Détermine si une erreur est récupérable
   */
  static isRecoverable(error: Error): boolean {
    if (error instanceof DocumentAnalysisError) {
      return error.recoverable;
    }
    
    // Erreurs réseau généralement récupérables
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return true;
    }
    
    // Erreurs de mémoire généralement non récupérables
    if (error.message.toLowerCase().includes('memory') || error.message.toLowerCase().includes('out of')) {
      return false;
    }
    
    // Par défaut, considérer comme récupérable
    return true;
  }

  /**
   * Génère un message d'erreur convivial pour l'utilisateur
   */
  static getUserFriendlyMessage(error: Error): string {
    if (error instanceof OCRInitializationError) {
      return 'Le moteur d\'analyse n\'a pas pu démarrer. Veuillez réessayer.';
    }
    
    if (error instanceof DocumentConversionError) {
      return 'Impossible de traiter ce type de document. Vérifiez le format du fichier.';
    }
    
    if (error instanceof TextExtractionError) {
      return 'Impossible de lire le contenu du document. Le fichier pourrait être corrompu.';
    }
    
    if (error instanceof DocumentParsingError) {
      return 'Document analysé mais aucune information pertinente trouvée.';
    }
    
    // Messages pour erreurs communes
    if (error.message.toLowerCase().includes('memory')) {
      return 'Le fichier est trop volumineux pour être analysé automatiquement.';
    }
    
    if (error.message.toLowerCase().includes('network') || error.message.includes('fetch')) {
      return 'Problème de connexion. Vérifiez votre réseau et réessayez.';
    }
    
    if (error.message.toLowerCase().includes('timeout')) {
      return 'L\'analyse prend trop de temps. Essayez avec un fichier plus petit.';
    }
    
    // Message générique
    return 'Une erreur inattendue s\'est produite lors de l\'analyse. Vous pouvez continuer en remplissant manuellement.';
  }

  /**
   * Détermine si on doit suggérer une nouvelle tentative
   */
  static shouldRetry(error: Error, attemptCount: number = 0): boolean {
    if (attemptCount >= 2) return false; // Maximum 3 tentatives
    
    if (!this.isRecoverable(error)) return false;
    
    // Retry pour erreurs réseau
    if (error.message.toLowerCase().includes('network') || error.message.includes('fetch')) {
      return true;
    }
    
    // Retry pour erreurs d'initialisation
    if (error instanceof OCRInitializationError) {
      return true;
    }
    
    return false;
  }

  /**
   * Log une erreur avec contexte
   */
  static logError(error: Error, context: { fileName?: string; fileSize?: number; documentType?: string } = {}): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error instanceof DocumentAnalysisError ? error.code : 'UNKNOWN',
        recoverable: this.isRecoverable(error)
      },
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    console.error('📄 Document Analysis Error:', logData);
    
    // En production, vous pourriez envoyer ces logs à un service de monitoring
    // analytics.track('document_analysis_error', logData);
  }
}
