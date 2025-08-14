import { supabase } from '@/lib/supabase';
import type { FileItem } from '@/types/file';

/**
 * Service pour mettre à jour les métadonnées d'un fichier
 */
export async function updateFileMetadata(
  fileId: string, 
  updates: Partial<Pick<FileItem, 'amount' | 'name' | 'document_date' | 'year' | 'month'>>
): Promise<void> {
  try {
    console.log('Updating file metadata:', fileId, updates);
    
    const { error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', fileId);

    if (error) {
      console.error('Error updating file metadata:', error);
      throw new Error(`Erreur lors de la mise à jour du fichier: ${error.message}`);
    }

    console.log('File metadata updated successfully');
  } catch (error) {
    console.error('File update service error:', error);
    throw error;
  }
}

/**
 * Service pour récupérer les informations d'un fichier
 */
export async function getFileById(fileId: string): Promise<FileItem | null> {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      console.error('Error fetching file:', error);
      throw new Error(`Erreur lors de la récupération du fichier: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('File fetch service error:', error);
    throw error;
  }
}