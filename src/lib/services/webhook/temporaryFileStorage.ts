// Service de stockage temporaire pour les fichiers
// Permet à N8n de télécharger les fichiers via une URL publique

export interface TemporaryFileUpload {
  url: string;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
}

export class TemporaryFileStorage {
  // Option 1: Utiliser un service gratuit comme file.io
  static async uploadToFileIo(file: File): Promise<TemporaryFileUpload> {
    try {
      console.log('📤 [TempStorage] Upload vers file.io...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expires', '1h'); // Expire dans 1 heure
      formData.append('maxDownloads', '5'); // Maximum 5 téléchargements
      
      const response = await fetch('https://file.io', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Erreur upload file.io: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Upload file.io échoué');
      }
      
      console.log('✅ [TempStorage] Upload file.io réussi:', result.link);
      
      return {
        url: result.link,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 heure
        downloadCount: 0,
        maxDownloads: 5
      };
      
    } catch (error) {
      console.error('❌ [TempStorage] Erreur file.io:', error);
      throw error;
    }
  }

  // Option 2: Utiliser tmpfiles.org (gratuit, pas d'inscription)
  static async uploadToTmpFiles(file: File): Promise<TemporaryFileUpload> {
    try {
      console.log('📤 [TempStorage] Upload vers tmpfiles.org...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Erreur upload tmpfiles: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error('Upload tmpfiles échoué');
      }
      
      // Convertir l'URL pour le téléchargement direct
      const downloadUrl = result.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      
      console.log('✅ [TempStorage] Upload tmpfiles réussi:', downloadUrl);
      
      return {
        url: downloadUrl,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 heure
        downloadCount: 0,
        maxDownloads: 100
      };
      
    } catch (error) {
      console.error('❌ [TempStorage] Erreur tmpfiles:', error);
      throw error;
    }
  }

  // Option 3: Utiliser 0x0.st (simple et gratuit)
  static async uploadTo0x0(file: File): Promise<TemporaryFileUpload> {
    try {
      console.log('📤 [TempStorage] Upload vers 0x0.st...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('https://0x0.st', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Erreur upload 0x0.st: ${response.status}`);
      }
      
      const url = await response.text();
      
      console.log('✅ [TempStorage] Upload 0x0.st réussi:', url.trim());
      
      return {
        url: url.trim(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
        downloadCount: 0,
        maxDownloads: 1000
      };
      
    } catch (error) {
      console.error('❌ [TempStorage] Erreur 0x0.st:', error);
      throw error;
    }
  }

  // Fonction principale avec fallback entre plusieurs services
  static async uploadFile(file: File): Promise<TemporaryFileUpload> {
    console.log('📤 [TempStorage] Début upload fichier:', file.name);
    
    // Tenter plusieurs services dans l'ordre de préférence
    const services = [
      { name: '0x0.st', method: this.uploadTo0x0 },
      { name: 'tmpfiles.org', method: this.uploadToTmpFiles },
      { name: 'file.io', method: this.uploadToFileIo }
    ];
    
    for (const service of services) {
      try {
        console.log(`📤 [TempStorage] Tentative avec ${service.name}...`);
        const result = await service.method(file);
        console.log(`✅ [TempStorage] Succès avec ${service.name}`);
        return result;
      } catch (error) {
        console.warn(`⚠️ [TempStorage] Échec ${service.name}:`, error);
        // Continuer avec le service suivant
      }
    }
    
    throw new Error('Tous les services de stockage temporaire ont échoué');
  }

  // Créer une Data URL en fallback (si tous les services échouent)
  static async createDataUrl(file: File): Promise<TemporaryFileUpload> {
    console.log('📤 [TempStorage] Création Data URL en fallback...');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        console.log('✅ [TempStorage] Data URL créée, taille:', dataUrl.length);
        
        resolve({
          url: dataUrl,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          downloadCount: 0,
          maxDownloads: 1
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Fonction avec fallback complet
  static async uploadWithFallback(file: File): Promise<TemporaryFileUpload> {
    try {
      // Tenter l'upload vers un service externe
      return await this.uploadFile(file);
    } catch (error) {
      console.warn('⚠️ [TempStorage] Tous les services externes ont échoué, utilisation Data URL');
      // En cas d'échec, utiliser une Data URL
      return await this.createDataUrl(file);
    }
  }
}
