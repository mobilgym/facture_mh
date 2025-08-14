export class UploadError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'UploadError';
  }

  static fromError(error: unknown): UploadError {
    if (error instanceof UploadError) {
      return error;
    }

    const err = error as any;
    if (err?.message?.includes('Bucket not found')) {
      return new UploadError(
        'Le service de stockage n\'est pas disponible',
        'STORAGE_NOT_AVAILABLE'
      );
    }

    if (err?.statusCode === 413 || err?.message?.includes('too large')) {
      return new UploadError(
        'Le fichier est trop volumineux',
        'FILE_TOO_LARGE'
      );
    }

    console.error('Unexpected upload error:', error);
    return new UploadError(
      'Une erreur inattendue est survenue lors du téléchargement',
      'UNKNOWN_ERROR',
      error
    );
  }
}