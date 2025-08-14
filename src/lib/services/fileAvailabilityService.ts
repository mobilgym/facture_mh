import { supabase } from '../supabase';

export async function checkFileAvailability(path: string): Promise<boolean> {
  if (!path) return false;
  
  try {
    // Vérifie si le fichier existe dans le stockage
    const { data: list, error: listError } = await supabase.storage
      .from('test')
      .list(path.split('/').slice(0, -1).join('/'));

    if (listError) {
      console.error('File list error:', listError);
      return false;
    }

    // Vérifie si le fichier est dans la liste
    const fileName = path.split('/').pop();
    return list.some(item => item.name === fileName);
  } catch (error) {
    console.error('File availability check error:', error);
    return false;
  }
}

export async function cleanupUnavailableFiles(): Promise<void> {
  try {
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, path');

    if (filesError) throw filesError;

    for (const file of files) {
      const isAvailable = await checkFileAvailability(file.path);
      if (!isAvailable) {
        // Supprime l'enregistrement de la base de données
        await supabase
          .from('files')
          .delete()
          .eq('id', file.id);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
}