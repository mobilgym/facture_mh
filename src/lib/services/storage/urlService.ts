import { supabase } from '../../supabase';
import { STORAGE_CONFIG } from '../../config/storage';
import { UploadError } from '../../errors/uploadError';

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