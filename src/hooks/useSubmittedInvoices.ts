import { useState, useEffect, useCallback } from 'react';
import { supabaseInvoices } from '@/lib/supabaseInvoices';
import type { SubmittedInvoice } from '@/types/invoice';

interface UseSubmittedInvoicesOptions {
  year?: string | null;
  month?: string | null;
}

export function useSubmittedInvoices({ year, month }: UseSubmittedInvoicesOptions = {}) {
  const [invoices, setInvoices] = useState<SubmittedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching invoices with params:', { year, month });
      
      let query = supabaseInvoices
        .from('submitted_invoices')
        .select('*')
        .order('document_date', { ascending: false });
        
      if (year) {
        query = query.eq('year', year);
      }
      
      if (month) {
        query = query.eq('month', month);
      }
      
      const { data, error: err } = await query;
      
      if (err) {
        console.error('Supabase error:', err);
        throw err;
      }
      
      console.log('Fetched invoices:', data);
      setInvoices(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching submitted invoices:', err);
      setError('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  const updateInvoice = useCallback(async (invoiceId: string, updates: Partial<SubmittedInvoice>) => {
    try {
      setUpdating(true);
      console.log('Updating invoice:', invoiceId, updates);
      
      const { error: updateError } = await supabaseInvoices
        .from('submitted_invoices')
        .update(updates)
        .eq('id', invoiceId);
      
      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }
      
      // Mettre à jour localement
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, ...updates }
            : invoice
        )
      );
      
      console.log('Invoice updated successfully');
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError('Erreur lors de la mise à jour de la facture');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { 
    invoices, 
    loading, 
    updating, 
    error, 
    refetch: fetchInvoices, 
    updateInvoice 
  };
}