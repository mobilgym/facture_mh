import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import type { Company } from '@/types/company';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (err) throw err;
      
      setCompanies(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Erreur lors du chargement des sociétés');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return { companies, loading, error, refetch: fetchCompanies };
}