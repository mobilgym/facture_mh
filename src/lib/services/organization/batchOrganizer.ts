import { supabase } from '@/lib/supabase';
import { organizeFile } from './fileOrganizer';
import { DatabaseError } from '@/types/database';

export async function organizeAllFiles(): Promise<void> {
  try {
    // Récupérer tous les fichiers
    const { data: files, error: fetchError } = await supabase
      .from('files')
      .select('*');

    if (fetchError) throw new DatabaseError('FETCH_ERROR', 'Erreur lors de la récupération des fichiers');
    if (!files) return;

    // Organiser chaque fichier
    for (const file of files) {
      const date = file.document_date ? new Date(file.document_date) : new Date(file.created_at);
      await organizeFile(file.id, date);
    }

  } catch (error) {
    console.error('Batch organization error:', error);
    throw error;
  }
}