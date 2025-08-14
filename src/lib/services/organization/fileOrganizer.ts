import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { buildOrganizedPath } from './pathBuilder';
import { DatabaseError } from '@/types/database';
import { StorageError } from '@/types/storage';
import { validateFilePath } from './validator';

export async function organizeFile(fileId: string, date: Date): Promise<void> {
  try {
    // 1. Get file info
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new DatabaseError('FETCH_ERROR', 'Erreur lors de la récupération du fichier');
    }
    
    if (!file) {
      throw new DatabaseError('NOT_FOUND', 'Fichier non trouvé');
    }

    // 2. Build and validate new path
    const newPath = buildOrganizedPath(file.path, date);
    if (!validateFilePath(newPath)) {
      throw new StorageError('INVALID_PATH', 'Chemin de fichier invalide');
    }

    // 3. Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('test')
      .download(file.path);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new StorageError('DOWNLOAD_ERROR', 'Erreur lors du téléchargement du fichier');
    }

    if (!fileData) {
      throw new StorageError('FILE_NOT_FOUND', 'Fichier source introuvable');
    }

    // 4. Upload to new location
    const { error: uploadError } = await supabase.storage
      .from('test')
      .upload(newPath, fileData, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new StorageError('UPLOAD_ERROR', 'Erreur lors du téléchargement du fichier');
    }

    // 5. Get new public URL
    const { data: urlData } = supabase.storage
      .from('test')
      .getPublicUrl(newPath);

    if (!urlData?.publicUrl) {
      // Rollback: delete the uploaded file
      await supabase.storage
        .from('test')
        .remove([newPath]);
      throw new StorageError('URL_ERROR', 'Erreur lors de la génération de l\'URL');
    }

    // 6. Update database record
    const { error: updateError } = await supabase
      .from('files')
      .update({
        path: newPath,
        url: urlData.publicUrl,
        year: format(date, 'yyyy'),
        month: format(date, 'MM'),
        document_date: date.toISOString()
      })
      .eq('id', fileId);

    if (updateError) {
      // Rollback: delete the uploaded file
      await supabase.storage
        .from('test')
        .remove([newPath]);
      throw new DatabaseError('UPDATE_ERROR', 'Erreur lors de la mise à jour des métadonnées');
    }

    // 7. Delete old file
    const { error: deleteError } = await supabase.storage
      .from('test')
      .remove([file.path]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      // Don't throw here as the file is already moved successfully
    }

  } catch (error) {
    console.error('File organization error:', error);
    throw error;
  }
}

export async function organizeFiles(files: { id: string; date: Date }[]): Promise<void> {
  const errors: Array<{ id: string; error: Error }> = [];

  for (const file of files) {
    try {
      await organizeFile(file.id, file.date);
    } catch (error) {
      console.error(`Error organizing file ${file.id}:`, error);
      errors.push({ id: file.id, error: error as Error });
    }
  }

  if (errors.length > 0) {
    throw new Error(`Failed to organize ${errors.length} files`);
  }
}