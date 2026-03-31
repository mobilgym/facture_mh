import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface RapprochementStatus {
  year: string;
  month: string;
  totalTransactions: number;
  matchedCount: number;
  status: 'pending' | 'partial' | 'complete';
}

/**
 * Charge les statuts de rapprochement pour tous les mois d'une entreprise.
 * Retourne un Map<"YYYY-MM", RapprochementStatus> pour un accès rapide.
 */
export function useRapprochementStatus(companyId: string | undefined) {
  const [statusMap, setStatusMap] = useState<Map<string, RapprochementStatus>>(new Map());

  useEffect(() => {
    if (!companyId) return;

    let cancelled = false;

    async function load() {
      try {
        const { data, error } = await supabase
          .from('rapprochements')
          .select('year, month, total_transactions, matched_count, status')
          .eq('company_id', companyId);

        if (error || cancelled) return;

        const map = new Map<string, RapprochementStatus>();
        for (const row of data || []) {
          const key = `${row.year}-${row.month}`;
          // Garder le plus récent si plusieurs existent
          if (!map.has(key)) {
            map.set(key, {
              year: row.year,
              month: row.month,
              totalTransactions: row.total_transactions || 0,
              matchedCount: row.matched_count || 0,
              status: row.status || 'pending'
            });
          }
        }
        setStatusMap(map);
      } catch {
        // silently fail
      }
    }

    load();
    return () => { cancelled = true; };
  }, [companyId]);

  return statusMap;
}
