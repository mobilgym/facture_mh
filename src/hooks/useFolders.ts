import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useCompany } from '@/contexts/CompanyContext';
import type { Folder } from '@/types/file';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedCompany } = useCompany();

  const fetchFolders = useCallback(async () => {
    if (!selectedCompany) return;
    
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('folders')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .order('name');
      
      if (err) throw err;
      
      setFolders(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Erreur lors du chargement des dossiers');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return { folders, loading, error, refetch: fetchFolders };
}