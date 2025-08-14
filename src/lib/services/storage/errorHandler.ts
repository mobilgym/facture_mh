import { StorageError } from '@supabase/storage-js';
import { UploadError } from '../../errors/uploadError';

export function handleUploadError(error: StorageError): never {
  console.error('Storage upload error:', error);
  
  if (error.message.includes('duplicate')) {
    throw new UploadError(
      'Un fichier avec ce nom existe déjà',
      'DUPLICATE_FILE'
    );
  }
  
  if (error.message.includes('permission')) {
    throw new UploadError(
      'Vous n\'avez pas les permissions nécessaires',
      'PERMISSION_DENIED'
    );
  }

  throw new UploadError(
    'Erreur lors du téléchargement',
    'UPLOAD_FAILED',
    error
  );
}