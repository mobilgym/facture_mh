import { useState, useEffect } from 'react';
import { TreasuryService, type GlobalTreasury } from '../lib/services/treasuryService';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from './useToast';

/**
 * Hook pour gérer la trésorerie globale
 */
export function useTreasury() {
  const [treasury, setTreasury] = useState<GlobalTreasury | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { selectedCompany } = useCompany();
  const { showToast } = useToast();

  /**
   * Charge la trésorerie globale
   */
  const loadTreasury = async () => {
    if (!selectedCompany?.id) {
      setTreasury(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Chargement de la trésorerie globale...');
      const data = await TreasuryService.getGlobalTreasury(selectedCompany.id);
      setTreasury(data);
      
      console.log('✅ Trésorerie chargée avec succès');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de la trésorerie';
      console.error('❌ Erreur lors du chargement de la trésorerie:', err);
      setError(errorMessage);
      showToast('Erreur lors du chargement de la trésorerie', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupère uniquement les factures VTE
   */
  const loadVteInvoices = async () => {
    if (!selectedCompany?.id) {
      return [];
    }

    try {
      console.log('🔄 Chargement des factures VTE...');
      const invoices = await TreasuryService.getVteInvoices(selectedCompany.id);
      console.log('✅ Factures VTE chargées:', invoices.length);
      return invoices;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des factures VTE';
      console.error('❌ Erreur lors du chargement des factures VTE:', err);
      showToast(errorMessage, 'error');
      return [];
    }
  };

  /**
   * Récupère un résumé rapide de la trésorerie
   */
  const loadTreasurySummary = async () => {
    if (!selectedCompany?.id) {
      return null;
    }

    try {
      console.log('🔄 Chargement du résumé de trésorerie...');
      const summary = await TreasuryService.getTreasurySummary(selectedCompany.id);
      console.log('✅ Résumé de trésorerie chargé:', summary);
      return summary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du résumé de trésorerie';
      console.error('❌ Erreur lors du chargement du résumé de trésorerie:', err);
      showToast(errorMessage, 'error');
      return null;
    }
  };

  /**
   * Rafraîchit les données de trésorerie
   */
  const refreshTreasury = async () => {
    await loadTreasury();
  };

  // Charger les données au montage et lors du changement d'entreprise
  useEffect(() => {
    loadTreasury();
  }, [selectedCompany?.id]);

  return {
    treasury,
    loading,
    error,
    loadTreasury,
    loadVteInvoices,
    loadTreasurySummary,
    refreshTreasury,
    
    // Données calculées pour un accès facile
    totalBudgets: treasury?.total_budgets || 0,
    totalSpent: treasury?.total_spent || 0,
    remainingBudgets: treasury?.remaining_budgets || 0,
    totalVteInvoices: treasury?.total_vte_invoices || 0,
    globalTreasury: treasury?.global_treasury || 0,
    activeBudgetsCount: treasury?.active_budgets_count || 0,
    vteInvoicesCount: treasury?.vte_invoices_count || 0,
    
    // Données détaillées
    budgets: treasury?.budgets || [],
    vteInvoices: treasury?.vte_invoices || []
  };
}
