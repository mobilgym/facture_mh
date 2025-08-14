import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useCompany } from '@/contexts/CompanyContext';
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

  const fetchFiles = useCallback(async () => {
    if (!selectedCompany?.id) {
      setFiles([]);
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
      
      setFiles(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, folderId, year, month]);

  // Initial fetch
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Real-time subscription
  useEffect(() => {
    if (!selectedCompany?.id) return;

    const subscription = supabase
      .channel('files_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'files',
          filter: `company_id=eq.${selectedCompany.id}`
        }, 
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setFiles(current => current.filter(f => f.id !== payload.old.id));
          } else if (payload.eventType === 'INSERT') {
            setFiles(current => [payload.new as FileItem, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setFiles(current => 
              current.map(f => f.id === payload.new.id ? payload.new as FileItem : f)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedCompany?.id]);

  return { files, loading, error, refetch: fetchFiles };
}