import { supabase } from '../../supabase';
import { STORAGE_CONFIG } from '../../config/storage';
import { UploadError } from '../../errors/uploadError';

export async function verifyBucketExists(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.id === STORAGE_CONFIG.BUCKET_NAME);
  
  if (!bucketExists) {
    throw new UploadError(
      'Le service de stockage n\'est pas disponible',
      'STORAGE_NOT_AVAILABLE'
    );
  }
}