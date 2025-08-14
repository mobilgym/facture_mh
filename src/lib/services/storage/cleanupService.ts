import { supabase } from '../../supabase';

async function listFolders(prefix: string = ''): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from('test')
    .list(prefix);

  if (error) {
    console.error('Error listing folders:', error);
    return [];
  }

  return data
    .filter(item => !item.name.includes('.')) // Only folders
    .map(item => prefix ? `${prefix}/${item.name}` : item.name);
}

async function isFolderEmpty(path: string): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from('test')
    .list(path);

  if (error) {
    console.error('Error checking folder:', error);
    return true;
  }

  return data.length === 0;
}

export async function cleanupEmptyFolders(): Promise<void> {
  try {
    // Get all year folders
    const yearFolders = await listFolders();

    for (const yearPath of yearFolders) {
      // Get month folders for each year
      const monthFolders = await listFolders(yearPath);
      
      // Check and delete empty month folders
      for (const monthPath of monthFolders) {
        if (await isFolderEmpty(monthPath)) {
          const { error: deleteMonthError } = await supabase.storage
            .from('test')
            .remove([`${monthPath}/`]);

          if (deleteMonthError) {
            console.error('Error deleting month folder:', deleteMonthError);
          }
        }
      }

      // Check if year folder is empty after cleaning months
      if (await isFolderEmpty(yearPath)) {
        const { error: deleteYearError } = await supabase.storage
          .from('test')
          .remove([`${yearPath}/`]);

        if (deleteYearError) {
          console.error('Error deleting year folder:', deleteYearError);
        }
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
}