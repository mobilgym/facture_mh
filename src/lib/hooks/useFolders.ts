import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useCompany } from '@/contexts/CompanyContext';
import { folderCache } from '../cache/folderCache';
import type { Folder } from '@/types/file';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedCompany } = useCompany();

  const getCacheKey = useCallback(() => {
    return `folders:${selectedCompany?.id}`;
  }, [selectedCompany?.id]);

  const fetchFolders = useCallback(async () => {
    if (!selectedCompany) return;
    
    const cacheKey = getCacheKey();
    const cachedData = folderCache.get(cacheKey);
    if (cachedData) {
      setFolders(cachedData);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('folders')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .order('name');
      
      if (err) throw err;
      
      const foldersData = data || [];
      setFolders(foldersData);
      folderCache.set(cacheKey, foldersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Erreur lors du chargement des dossiers');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, getCacheKey]);

  const prefetchFolders = useCallback(async () => {
    if (!selectedCompany?.id) return;

    const cacheKey = getCacheKey();
    if (folderCache.get(cacheKey)) return;

    try {
      const { data } = await supabase
        .from('folders')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .order('name');

      if (data) {
        folderCache.set(cacheKey, data);
      }
    } catch (error) {
      console.error('Error prefetching folders:', error);
    }
  }, [selectedCompany?.id, getCacheKey]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    const subscription = supabase
      .channel('folders_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders',
          filter: `company_id=eq.${selectedCompany?.id}`
        },
        () => {
          folderCache.invalidate(getCacheKey());
          fetchFolders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedCompany?.id, fetchFolders, getCacheKey]);

  return {
    folders,
    loading,
    error,
    refetch: fetchFolders,
    prefetchFolders
  };
}