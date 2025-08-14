import { supabase } from '../../supabase';
import { StorageError } from '@/types/storage';

export async function deleteFromStorage(path: string): Promise<void> {
  try {
    // Delete the file directly - if it doesn't exist, Supabase will handle it gracefully
    const { error: deleteError } = await supabase.storage
      .from('test')
      .remove([path]);

    if (deleteError) {
      // Ignore 404 errors as the file might have already been deleted
      if (deleteError.message.includes('Object not found')) {
        console.warn('File already deleted from storage:', path);
        return;
      }

      console.error('Storage deletion error:', deleteError);
      throw new StorageError('STORAGE_DELETE_ERROR', 'Erreur lors de la suppression du fichier');
    }
  } catch (error) {
    if (error instanceof StorageError) throw error;
    
    console.error('Delete from storage error:', error);
    throw new StorageError('STORAGE_ERROR', 'Erreur lors de la suppression du fichier');
  }
}