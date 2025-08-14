import { supabase } from '../../supabase';
import { STORAGE_CONFIG } from '../../config/storage';
import { UploadError } from '../../errors/uploadError';
import { verifyBucketExists } from './bucketService';
import { handleUploadError } from './errorHandler';

export async function uploadToStorage(path: string, file: File): Promise<string> {
  try {
    await verifyBucketExists();

    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      handleUploadError(error);
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