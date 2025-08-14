// Classe d'erreur personnalisée pour les uploads
export class UploadError extends Error {
  constructor(message: string = 'Une erreur est survenue lors du téléchargement.') {
    super(message);
    this.name = 'UploadError';
    console.error(`[UploadError]: ${message}`);
  }
}