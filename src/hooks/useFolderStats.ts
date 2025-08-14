import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { FolderStats } from '@/types/file';

export function useFolderStats(folderId: string | null) {
  const [stats, setStats] = useState<FolderStats>({
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('files')
          .select('type, size')
          .eq('folder_id', folderId);
        
        if (err) throw err;

        const newStats: FolderStats = {
          totalFiles: data.length,
          totalSize: 0,
          fileTypes: {}
        };
        
        data.forEach(file => {
          newStats.totalSize += file.size;
          newStats.fileTypes[file.type] = (newStats.fileTypes[file.type] || 0) + 1;
        });
        
        setStats(newStats);
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [folderId]);

  return { stats, loading, error };
}