import { supabase } from '../supabase';

const inflightFolderChecks = new Map<string, Promise<Set<string> | null>>();

const getFolderKey = (folderPath: string) => folderPath || '__root__';

const extractFolderPath = (path: string) => {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/');
};

const extractFileName = (path: string) => {
  const parts = path.split('/');
  return parts[parts.length - 1] || '';
};

async function listFolderContents(folderPath: string): Promise<Set<string> | null> {
  const key = getFolderKey(folderPath);
  const existing = inflightFolderChecks.get(key);
  if (existing) return existing;

  const request = (async () => {
    const { data: list, error: listError } = await supabase.storage
      .from('test')
      .list(folderPath || '', { limit: 1000 });

    if (listError) {
      console.error('File list error:', listError);
      return null;
    }

    return new Set((list || []).map((item) => item.name));
  })();

  inflightFolderChecks.set(key, request);

  try {
    return await request;
  } finally {
    inflightFolderChecks.delete(key);
  }
}

export async function checkFileAvailability(path: string): Promise<boolean> {
  if (!path) return false;

  try {
    const folderPath = extractFolderPath(path);
    const fileName = extractFileName(path);
    if (!fileName) return false;

    const list = await listFolderContents(folderPath);
    if (!list) return false;

    return list.has(fileName);
  } catch (error) {
    console.error('File availability check error:', error);
    return false;
  }
}

export async function checkFilesAvailability(paths: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const grouped = new Map<string, string[]>();

  for (const path of paths) {
    if (!path) continue;
    const folderPath = extractFolderPath(path);
    if (!grouped.has(folderPath)) {
      grouped.set(folderPath, []);
    }
    grouped.get(folderPath)!.push(path);
  }

  await Promise.all(
    Array.from(grouped.entries()).map(async ([folderPath, folderPaths]) => {
      const list = await listFolderContents(folderPath);

      folderPaths.forEach((path) => {
        const fileName = extractFileName(path);
        if (!fileName || !list) {
          results.set(path, false);
          return;
        }
        results.set(path, list.has(fileName));
      });
    })
  );

  return results;
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
