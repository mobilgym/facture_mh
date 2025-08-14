import { supabase } from '../supabase';
import { STORAGE_CONFIG } from '../config/storage';
import { UploadError } from '../errors/uploadError';

export async function uploadToStorage(path: string, file: File): Promise<string> {
  try {
    // Verify bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.id === STORAGE_CONFIG.BUCKET_NAME);
    
    if (!bucketExists) {
      throw new UploadError(
        'Le service de stockage n\'est pas disponible',
        'STORAGE_NOT_AVAILABLE'
      );
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
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

    if (!data?.path) {
      throw new UploadError(
        'Chemin du fichier non disponible',
        'INVALID_RESPONSE'
      );
    }

    return data.path;
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof UploadError ? error : UploadError.fromError(error);
  }
}

export async function getPublicUrl(path: string): Promise<string> {
  try {
    const { data } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(path);
    
    if (!data?.publicUrl) {
      throw new UploadError(
        'URL du fichier non disponible',
        'URL_GENERATION_FAILED'
      );
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error('Get public URL error:', error);
    throw UploadError.fromError(error);
  }
}