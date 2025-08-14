import { supabase } from '../supabase';
import { checkFileAvailability } from './fileAvailabilityService';
import { cleanupEmptyFolders } from './storage/cleanupService';
import type { FileItem } from '@/types/file';

export async function deleteFile(file: FileItem): Promise<void> {
  try {
    // 1. Vérifie si le fichier existe dans le stockage
    const isAvailable = await checkFileAvailability(file.path);

    // 2. Supprime d'abord l'enregistrement de la base de données
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', file.id);

    if (dbError) throw dbError;

    // 3. Si le fichier existe dans le stockage, le supprime
    if (isAvailable) {
      const { error: storageError } = await supabase.storage
        .from('test')
        .remove([file.path]);

      if (storageError && !storageError.message.includes('Object not found')) {
        console.error('Storage deletion error:', storageError);
      }
    }

    // 4. Nettoie les dossiers vides
    await cleanupEmptyFolders();
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
}