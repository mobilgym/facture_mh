import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useCompany } from '@/contexts/CompanyContext';
import { fileCache } from '../cache/fileCache';
import type { FileItem } from '@/types/file';

interface UseFilesOptions {
  folderId?: string | null;
  year?: string | null;
  month?: string | null;
}

export function useFiles({ folderId, year, month }: UseFilesOptions = {}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedCompany } = useCompany();

  const getCacheKey = useCallback(() => {
    return `files:${selectedCompany?.id}:${folderId}:${year}:${month}`;
  }, [selectedCompany?.id, folderId, year, month]);

  const fetchFiles = useCallback(async () => {
    if (!selectedCompany?.id) {
      setFiles([]);
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey();
    const cachedData = fileCache.get(cacheKey);
    if (cachedData) {
      setFiles(cachedData);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from('files')
        .select('*')
        .eq('company_id', selectedCompany.id);
        
      if (folderId) {
        query = query.eq('folder_id', folderId);
      }
      
      if (year) {
        query = query.eq('year', year);
      }
      
      if (month) {
        query = query.eq('month', month);
      }
      
      const { data, error: err } = await query.order('created_at', { ascending: false });
      
      if (err) throw err;
      
      const filesData = data || [];
      setFiles(filesData);
      fileCache.set(cacheKey, filesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, folderId, year, month, getCacheKey]);

  const prefetchFiles = useCallback(async (options?: UseFilesOptions) => {
    if (!selectedCompany?.id) return;

    const cacheKey = `files:${selectedCompany.id}:${options?.folderId}:${options?.year}:${options?.month}`;
    if (fileCache.get(cacheKey)) return;

    try {
      let query = supabase
        .from('files')
        .select('*')
        .eq('company_id', selectedCompany.id);

      if (options?.folderId) {
        query = query.eq('folder_id', options.folderId);
      }
      
      if (options?.year) {
        query = query.eq('year', options.year);
      }
      
      if (options?.month) {
        query = query.eq('month', options.month);
      }

      const { data } = await query.order('created_at', { ascending: false });
      if (data) {
        fileCache.set(cacheKey, data);
      }
    } catch (error) {
      console.error('Error prefetching files:', error);
    }
  }, [selectedCompany?.id]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    const subscription = supabase
      .channel('files_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'files',
          filter: `company_id=eq.${selectedCompany?.id}`
        }, 
        (payload) => {
          fileCache.invalidate(getCacheKey());
          fetchFiles();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedCompany?.id, fetchFiles, getCacheKey]);

  return { 
    files, 
    loading, 
    error, 
    refetch: fetchFiles,
    prefetchFiles
  };
}