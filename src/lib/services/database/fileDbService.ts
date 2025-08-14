import { supabase } from '../../supabase';
import { DatabaseError } from '@/types/database';

export async function deleteFileRecord(fileId: string): Promise<void> {
  try {
    // Delete the database record directly
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      console.error('Database deletion error:', deleteError);
      throw new DatabaseError('DB_DELETE_ERROR', 'Erreur lors de la suppression des métadonnées');
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    
    console.error('Delete from database error:', error);
    throw new DatabaseError('DB_ERROR', 'Erreur lors de la suppression des métadonnées');
  }
}