import { TemporaryFileStorage } from './temporaryFileStorage';
import { WebhookConfigService, WebhookConfiguration } from './webhookConfigService';

export interface WebhookExtractedData {
  fileName: string | null;
  amount: number | null;
  date: string | null;
  success: boolean;
  message?: string;
}

export class N8nWebhookService {
  private config: WebhookConfiguration;
  private userId: string | null = null;

  constructor(config: WebhookConfiguration, userId?: string) {
    this.config = config;
    this.userId = userId || null;
  }

  // Mettre à jour la configuration du webhook
  updateConfig(config: WebhookConfiguration): void {
    this.config = config;
  }

  // Définir l'ID utilisateur pour les opérations de base de données
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Récupérer la configuration depuis Supabase
  static async loadConfig(): Promise<WebhookConfiguration> {
    try {
      const config = await WebhookConfigService.getActiveConfiguration();
      
      if (config) {
        console.log('🔗 [Webhook] Configuration globale chargée depuis Supabase:', config);
        return config;
      } else {
        console.log('🔗 [Webhook] Aucune configuration active trouvée, configuration par défaut utilisée');
        return {
          url: '',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          enabled: false
        };
      }
    } catch (error) {
      console.error('❌ [Webhook] Erreur lors du chargement depuis Supabase:', error);
      
      // Fallback vers localStorage pour migration douce
      try {
        const saved = localStorage.getItem('webhook_config');
        if (saved) {
          const legacyConfig = JSON.parse(saved);
          console.log('🔗 [Webhook] Configuration legacy chargée depuis localStorage:', legacyConfig);
          return legacyConfig;
        }
      } catch (legacyError) {
        console.error('❌ [Webhook] Erreur lors du chargement legacy:', legacyError);
      }
      
      return {
        url: '',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        enabled: false
      };
    }
  }

  // Sauvegarder la configuration dans Supabase
  async saveConfig(config: WebhookConfiguration): Promise<void> {
    if (!this.userId) {
      console.error('❌ [Webhook] User ID manquant pour la sauvegarde');
      throw new Error('User ID manquant pour sauvegarder la configuration');
    }

    try {
      await WebhookConfigService.upsertConfiguration(config, this.userId);
      this.config = config;
      console.log('✅ [Webhook] Configuration globale sauvegardée dans Supabase');
    } catch (error) {
      console.error('❌ [Webhook] Erreur lors de la sauvegarde:', error);
      throw new Error('Impossible de sauvegarder la configuration webhook');
    }
  }

  // Envoyer un fichier au webhook N8n pour extraction
  async extractDataFromFile(file: File, documentType: 'achat' | 'vente'): Promise<WebhookExtractedData> {
    console.log('🔗 [N8n Webhook] Configuration actuelle:', this.config);
    
    if (!this.config.enabled) {
      console.error('❌ [N8n Webhook] Webhook désactivé');
      throw new Error('Le webhook n\'est pas activé. Activez-le dans la configuration.');
    }

    if (!this.config.url || this.config.url.trim() === '') {
      console.error('❌ [N8n Webhook] URL manquante');
      throw new Error('URL du webhook non configurée. Configurez-la dans les paramètres.');
    }

    try {
      console.log('🔗 [N8n Webhook] === DÉBUT EXTRACTION ===');
      console.log('🔗 [N8n Webhook] URL:', this.config.url);
      console.log('🔗 [N8n Webhook] Méthode:', this.config.method);
      console.log('🔗 [N8n Webhook] Headers:', this.config.headers);
      console.log('🔗 [N8n Webhook] Fichier:', file.name, '(' + file.size + ' bytes)');
      console.log('🔗 [N8n Webhook] Type de document:', documentType);
      
      // Créer une URL temporaire pour le fichier
      console.log('🔗 [N8n Webhook] Création d\'une URL temporaire pour le fichier...');
      const fileUrl = await this.createTemporaryFileUrl(file);
      console.log('🔗 [N8n Webhook] URL temporaire créée:', fileUrl);
      
      // Préparer les données à envoyer avec l'URL du fichier
      const payload = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: fileUrl, // URL pour télécharger le fichier
        documentType: documentType,
        timestamp: new Date().toISOString(),
        downloadExpiry: new Date(Date.now() + 30 * 60 * 1000).toISOString() // Expire dans 30 minutes
      };

      console.log('🔗 [N8n Webhook] Payload avec URL préparé:', payload);

      console.log('🔗 [N8n Webhook] Envoi de la requête...');

      // Faire la requête vers N8n avec l'URL du fichier
      const response = await fetch(this.config.url, {
        method: this.config.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers
        },
        body: JSON.stringify(payload)
      });

      console.log('🔗 [N8n Webhook] Réponse reçue - Status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔗 [N8n Webhook] Réponse reçue:', result);

      // Parser la réponse N8n
      return this.parseWebhookResponse(result, documentType);

    } catch (error) {
      console.error('❌ [N8n Webhook] Erreur lors de l\'extraction:', error);
      
      return {
        fileName: null,
        amount: null,
        date: null,
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Créer une URL temporaire pour le fichier
  private async createTemporaryFileUrl(file: File): Promise<string> {
    try {
      console.log('🔗 [N8n Webhook] Upload du fichier vers un service temporaire...');
      
      // Utiliser le service de stockage temporaire
      const uploadResult = await TemporaryFileStorage.uploadWithFallback(file);
      
      console.log('🔗 [N8n Webhook] Fichier uploadé avec succès');
      console.log('🔗 [N8n Webhook] URL:', uploadResult.url);
      console.log('🔗 [N8n Webhook] Expire le:', uploadResult.expiresAt);
      
      return uploadResult.url;
      
    } catch (error) {
      console.error('❌ [N8n Webhook] Erreur création URL temporaire:', error);
      throw new Error('Impossible de créer une URL pour le fichier');
    }
  }

  // Convertir un fichier en Data URL (data:...)
  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result); // Retourne l'URL complète avec préfixe data:
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Convertir un fichier en base64 (garde pour compatibilité)
  private async fileToBase64(file: File): Promise<string> {
    const dataUrl = await this.fileToDataUrl(file);
    return dataUrl.split(',')[1]; // Retourner seulement les données base64
  }

  // Parser la réponse du webhook N8n
  private parseWebhookResponse(response: any, documentType: 'achat' | 'vente'): WebhookExtractedData {
    try {
      // Structure attendue de la réponse N8n :
      // {
      //   "success": true,
      //   "data": {
      //     "companyName": "Amandine LE GOAREGUER",
      //     "amount": 150.00,
      //     "date": "2024-01-15"
      //   }
      // }

      if (!response || typeof response !== 'object') {
        throw new Error('Réponse webhook invalide');
      }

      const success = response.success === true;
      const data = response.data || {};

      // Générer le nom de fichier basé sur les données extraites
      const fileName = this.generateFileName(
        data.companyName, 
        data.date, 
        documentType
      );

      return {
        fileName: fileName,
        amount: typeof data.amount === 'number' ? data.amount : null,
        date: typeof data.date === 'string' ? data.date : null,
        success: success,
        message: response.message || (success ? 'Extraction réussie' : 'Extraction échouée')
      };

    } catch (error) {
      console.error('❌ [N8n Webhook] Erreur lors du parsing de la réponse:', error);
      
      return {
        fileName: null,
        amount: null,
        date: null,
        success: false,
        message: 'Erreur lors du parsing de la réponse webhook'
      };
    }
  }

  // Générer un nom de fichier basé sur les données extraites
  private generateFileName(companyName: string | null, date: string | null, documentType: 'achat' | 'vente'): string {
    const prefix = documentType === 'achat' ? 'Ach_' : 'Vte_';
    
    let namePart = '';
    if (companyName) {
      namePart = companyName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Supprimer les caractères spéciaux
        .replace(/\s+/g, '_') // Remplacer les espaces par des underscores
        .substring(0, 30); // Limiter la longueur
    }
    
    let datePart = '';
    if (date) {
      // Convertir la date au format YYYYMMDD
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        datePart = '_' + dateObj.toISOString().split('T')[0].replace(/-/g, '');
      }
    }
    
    return `${prefix}${namePart}${datePart}.pdf`;
  }

  // Tester la connexion webhook
  async testConnection(configId?: string): Promise<{ success: boolean; message: string; responseTime: number }> {
    if (!this.config.url) {
      return {
        success: false,
        message: 'URL du webhook non configurée',
        responseTime: 0
      };
    }

    const startTime = Date.now();
    let testResult: { success: boolean; message: string; responseTime: number };

    try {
      console.log('🔗 [N8n Webhook] Test de connexion vers:', this.config.url);

      // Test avec une requête POST simple pour vérifier CORS
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers
        },
        body: JSON.stringify({
          test: true,
          message: 'Test de connexion depuis l\'application'
        })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        testResult = {
          success: true,
          message: 'Connexion réussie - CORS configuré correctement',
          responseTime: responseTime
        };
      } else {
        testResult = {
          success: false,
          message: `Erreur HTTP ${response.status}: ${response.statusText}`,
          responseTime: responseTime
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Analyser le type d'erreur pour donner des conseils spécifiques
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      
      if (errorMessage.includes('CORS')) {
        testResult = {
          success: false,
          message: 'Erreur CORS - Configurez les headers CORS dans votre workflow N8n',
          responseTime: responseTime
        };
      } else {
        testResult = {
          success: false,
          message: errorMessage,
          responseTime: responseTime
        };
      }
    }

    // Enregistrer le résultat du test dans Supabase si possible
    if (configId && this.userId) {
      try {
        await WebhookConfigService.recordTestResult(configId, testResult.success, this.userId);
      } catch (error) {
        console.error('❌ [Webhook] Erreur lors de l\'enregistrement du test:', error);
        // Ne pas bloquer le test pour autant
      }
    }

    return testResult;
  }
}

// Factory pour créer une instance du service webhook avec configuration globale
export async function createN8nWebhookService(userId?: string): Promise<N8nWebhookService> {
  const config = await N8nWebhookService.loadConfig();
  const service = new N8nWebhookService(config, userId);
  return service;
}

// Instance globale du service webhook (sera initialisée dans les composants)
export let n8nWebhookService: N8nWebhookService | null = null;

// Fonction pour initialiser le service global
export async function initializeWebhookService(userId?: string): Promise<void> {
  n8nWebhookService = await createN8nWebhookService(userId);
}

// Fonction pour obtenir le service (avec gestion d'erreur si non initialisé)
export function getWebhookService(): N8nWebhookService {
  if (!n8nWebhookService) {
    throw new Error('Service webhook non initialisé. Appelez initializeWebhookService() d\'abord.');
  }
  return n8nWebhookService;
}
