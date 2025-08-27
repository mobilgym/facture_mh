import { useState, useCallback } from 'react';
import { LettrageService } from '../lib/services/lettrageService';
import { useToast } from './useToast';
import { useAuth } from '../contexts/AuthContext';
import type { CsvPayment, LettrageMatch, LettrageState } from '../types/lettrage';
import type { FileItem } from '../types/file';

export function useLettrage(companyId: string) {
  const [state, setState] = useState<LettrageState>({
    csvPayments: [],
    unmatchedInvoices: [],
    unmatchedPayments: [],
    matches: [],
    isLoading: false,
    selectedPeriod: {
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  });

  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();

  /**
   * Import et analyse d'un fichier CSV avec mapping personnalisé
   */
  const importCsvFileWithMapping = useCallback(async (
    headers: string[], 
    allRows: string[][], 
    mapping: { dateColumn: number; amountColumn: number; descriptionColumn: number | null }
  ) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const csvPayments = await LettrageService.parseCsvFileWithMapping(headers, allRows, mapping);
      
      setState(prev => ({
        ...prev,
        csvPayments,
        unmatchedPayments: csvPayments.filter(p => !p.isMatched),
        isLoading: false
      }));

      showSuccess(`${csvPayments.length} paiements importés avec succès`);
      return csvPayments;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      showError(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      throw error;
    }
  }, [showSuccess, showError]);

  /**
   * Import et analyse d'un fichier CSV (méthode legacy)
   */
  const importCsvFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const csvPayments = await LettrageService.parseCsvFile(file);
      
      setState(prev => ({
        ...prev,
        csvPayments,
        unmatchedPayments: csvPayments.filter(p => !p.isMatched),
        isLoading: false
      }));

      showSuccess(`${csvPayments.length} paiements importés avec succès`);
      return csvPayments;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      showError(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      throw error;
    }
  }, [showSuccess, showError]);

  /**
   * Charge les factures non lettrées pour la période sélectionnée
   */
  const loadUnmatchedInvoices = useCallback(async () => {
    if (!companyId) return;

    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const invoices = await LettrageService.getUnmatchedInvoices(
        companyId,
        state.selectedPeriod.startDate,
        state.selectedPeriod.endDate
      );

      setState(prev => ({
        ...prev,
        unmatchedInvoices: invoices,
        isLoading: false
      }));

      return invoices;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      showError('Erreur lors du chargement des factures');
      throw error;
    }
  }, [companyId, state.selectedPeriod, showError]);

  /**
   * Lance la comparaison automatique
   */
  const runAutomaticMatching = useCallback(async (tolerance: number = 0.01) => {
    if (state.unmatchedInvoices.length === 0 || state.csvPayments.length === 0) {
      showError('Aucune donnée à comparer');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const automaticMatches = LettrageService.findAutomaticMatches(
        state.unmatchedInvoices,
        state.csvPayments,
        tolerance
      );

      setState(prev => ({
        ...prev,
        matches: [...prev.matches, ...automaticMatches],
        unmatchedPayments: prev.csvPayments.filter(p => !p.isMatched),
        isLoading: false
      }));

      if (automaticMatches.length > 0) {
        showSuccess(`${automaticMatches.length} correspondances automatiques trouvées`);
      } else {
        showSuccess('Aucune correspondance automatique trouvée');
      }

      return automaticMatches;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      showError('Erreur lors de la comparaison automatique');
      throw error;
    }
  }, [state.unmatchedInvoices, state.csvPayments, showSuccess, showError]);

  /**
   * Ajoute une correspondance manuelle
   */
  const addManualMatch = useCallback((invoiceId: string, paymentId: string) => {
    const invoice = state.unmatchedInvoices.find(inv => inv.id === invoiceId);
    const payment = state.csvPayments.find(pay => pay.id === paymentId);

    if (!invoice || !payment || payment.isMatched) {
      showError('Correspondance invalide');
      return;
    }

    const newMatch: LettrageMatch = {
      id: crypto.randomUUID(),
      invoiceId,
      paymentId,
      invoiceAmount: invoice.amount || 0,
      paymentAmount: payment.amount,
      difference: Math.abs((invoice.amount || 0) - payment.amount),
      isAutomatic: false,
      isValidated: false,
      createdAt: new Date().toISOString()
    };

    // Marquer le paiement comme utilisé
    payment.isMatched = true;

    setState(prev => ({
      ...prev,
      matches: [...prev.matches, newMatch],
      unmatchedPayments: prev.csvPayments.filter(p => !p.isMatched)
    }));

    showSuccess('Correspondance manuelle ajoutée');
  }, [state.unmatchedInvoices, state.csvPayments, showSuccess, showError]);

  /**
   * Supprime une correspondance
   */
  const removeMatch = useCallback((matchId: string) => {
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return;

    // Libérer le paiement
    const payment = state.csvPayments.find(p => p.id === match.paymentId);
    if (payment) {
      payment.isMatched = false;
    }

    setState(prev => ({
      ...prev,
      matches: prev.matches.filter(m => m.id !== matchId),
      unmatchedPayments: prev.csvPayments.filter(p => !p.isMatched)
    }));

    showSuccess('Correspondance supprimée');
  }, [state.matches, state.csvPayments, showSuccess]);

  /**
   * Valide toutes les correspondances
   */
  const validateAllMatches = useCallback(async () => {
    if (state.matches.length === 0) {
      showError('Aucune correspondance à valider');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const validatedMatches: LettrageMatch[] = [];
      
      for (const match of state.matches) {
        if (!match.isValidated) {
          await LettrageService.saveLettrageMatch(match, companyId, user?.id);
          validatedMatches.push({ ...match, isValidated: true, validatedAt: new Date().toISOString() });
        }
      }

      setState(prev => ({
        ...prev,
        matches: prev.matches.map(m => 
          validatedMatches.find(vm => vm.id === m.id) || m
        ),
        isLoading: false
      }));

      showSuccess(`${validatedMatches.length} lettrages validés avec succès`);
      
      // Recharger les factures pour mettre à jour l'affichage
      await loadUnmatchedInvoices();
      
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      showError('Erreur lors de la validation');
      throw error;
    }
  }, [state.matches, showSuccess, showError, loadUnmatchedInvoices]);

  /**
   * Met à jour la période de recherche
   */
  const updatePeriod = useCallback((startDate: string, endDate: string) => {
    setState(prev => ({
      ...prev,
      selectedPeriod: { startDate, endDate }
    }));
  }, []);

  /**
   * Recherche dans les paiements CSV
   */
  const searchPayments = useCallback((query: string) => {
    return LettrageService.searchInCsvPayments(state.csvPayments, query);
  }, [state.csvPayments]);

  /**
   * Calcule les statistiques
   */
  const getStats = useCallback(() => {
    return LettrageService.calculateLettrageStats(
      state.unmatchedInvoices,
      state.csvPayments,
      state.matches
    );
  }, [state.unmatchedInvoices, state.csvPayments, state.matches]);

  /**
   * Remet à zéro l'état
   */
  const resetLettrage = useCallback(() => {
    setState({
      csvPayments: [],
      unmatchedInvoices: [],
      unmatchedPayments: [],
      matches: [],
      isLoading: false,
      selectedPeriod: {
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    });
  }, []);

  /**
   * Restaurer un état de lettrage sauvegardé
   */
  const restoreState = useCallback((lettrageState: LettrageState) => {
    console.log('🔄 Restauration état lettrage:', {
      csvPayments: lettrageState.csvPayments?.length || 0,
      matches: lettrageState.matches?.length || 0,
      unmatchedInvoices: lettrageState.unmatchedInvoices?.length || 0
    });
    
    setState(prevState => ({
      ...lettrageState,
      isLoading: false,
      error: null,
      selectedPeriod: prevState.selectedPeriod // Conserver la période sélectionnée
    }));
  }, []);

  return {
    // État
    ...state,
    
    // Actions
    importCsvFile,
    importCsvFileWithMapping,
    loadUnmatchedInvoices,
    runAutomaticMatching,
    addManualMatch,
    removeMatch,
    validateAllMatches,
    updatePeriod,
    searchPayments,
    resetLettrage,
    restoreState,
    
    // Utilitaires
    getStats
  };
}
