import { useState, useCallback } from 'react';
import { RapprochementService } from '../lib/services/rapprochementService';
import { useToast } from './useToast';
import { useAuth } from '../contexts/AuthContext';
import type { BankTransaction, RapprochementMatch, RapprochementState } from '../types/rapprochement';
import type { FileItem } from '../types/file';

const initialState: RapprochementState = {
  transactions: [],
  matches: [],
  unmatchedTransactions: [],
  unmatchedInvoices: [],
  isLoading: false,
  isParsing: false,
  step: 'upload',
  stats: {
    totalTransactions: 0,
    totalInvoices: 0,
    matchedCount: 0,
    unmatchedTransactionCount: 0,
    unmatchedInvoiceCount: 0,
    totalTransactionAmount: 0,
    totalInvoiceAmount: 0,
    matchedAmount: 0,
    matchingRate: 0
  }
};

export function useRapprochement(companyId: string) {
  const [state, setState] = useState<RapprochementState>(initialState);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [savedRecord, setSavedRecord] = useState<any>(null);
  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();

  /**
   * Persiste les matches en base (appel silencieux)
   */
  const persistMatches = useCallback(async (
    matches: RapprochementMatch[],
    transactions: BankTransaction[],
    stats: any,
    pdfFileName: string,
    year: string,
    month: string
  ) => {
    if (!user?.id || !companyId) return;
    try {
      await RapprochementService.saveRapprochement(
        companyId, year, month, pdfFileName, stats, user.id, transactions, matches
      );
    } catch (e) {
      console.warn('Failed to persist matches:', e);
    }
  }, [companyId, user]);

  /**
   * Exécute le matching local, en préservant les matches validés déjà sauvegardés
   */
  const runLocalMatching = useCallback(async (
    transactions: BankTransaction[],
    year: string,
    month: string,
    pdfFileName: string,
    preservedMatches?: RapprochementMatch[]
  ) => {
    const invoices = await RapprochementService.getInvoicesForMonth(companyId, year, month);
    const resetTx = transactions.map(t => ({ ...t, isMatched: false }));

    // Si on a des matches validés sauvegardés, les restaurer d'abord
    const validated = (preservedMatches || []).filter(m => m.isValidated);
    const validatedTxIds = new Set(validated.map(m => m.transactionId));
    const validatedInvIds = new Set(validated.map(m => m.invoiceId));

    // Marquer les transactions déjà validées comme matchées
    for (const tx of resetTx) {
      if (validatedTxIds.has(tx.id)) tx.isMatched = true;
    }

    // Matcher le reste
    const remainingTx = resetTx.filter(t => !t.isMatched);
    const remainingInv = invoices.filter(inv => !validatedInvIds.has(inv.id));
    const newMatches = RapprochementService.findMatches(remainingInv, remainingTx);

    // Combiner validated + nouveaux matches
    const allMatches = [...validated, ...newMatches];
    const allMatchedInvIds = new Set(allMatches.map(m => m.invoiceId));
    const unmatchedInvoices = invoices.filter(inv => !allMatchedInvIds.has(inv.id));
    const unmatchedTransactions = resetTx.filter(t => !t.isMatched);
    const stats = RapprochementService.calculateStats(resetTx, invoices, allMatches);

    const hasAllValidated = allMatches.length > 0 && allMatches.every(m => m.isValidated);

    setState({
      transactions: resetTx,
      matches: allMatches,
      unmatchedTransactions,
      unmatchedInvoices,
      isLoading: false,
      isParsing: false,
      step: hasAllValidated ? 'validated' : 'results',
      stats,
      pdfFileName
    });

    return { matches: allMatches, stats };
  }, [companyId]);

  const checkForSavedData = useCallback(async (year: string, month: string) => {
    if (!companyId) return false;
    try {
      const saved = await RapprochementService.loadSavedTransactions(companyId, year, month);
      if (saved) {
        setHasSavedData(true);
        setSavedRecord(saved);
        return true;
      }
      setHasSavedData(false);
      setSavedRecord(null);
      return false;
    } catch {
      return false;
    }
  }, [companyId]);

  /**
   * Charge les données sauvegardées avec les matches validés
   */
  const loadSavedData = useCallback(async (year: string, month: string) => {
    if (!savedRecord) return;

    setState(prev => ({ ...prev, isLoading: true, step: 'parsing', pdfFileName: savedRecord.pdfFileName, pdfUrl: savedRecord.pdfUrl }));

    try {
      const { matches } = await runLocalMatching(
        savedRecord.transactions,
        year,
        month,
        savedRecord.pdfFileName,
        savedRecord.savedMatches
      );

      // Restaurer le pdfUrl
      setState(prev => ({ ...prev, pdfUrl: savedRecord.pdfUrl }));

      const validatedCount = matches.filter((m: RapprochementMatch) => m.isValidated).length;
      showSuccess(
        validatedCount > 0
          ? `${savedRecord.transactions.length} transactions chargées, ${validatedCount} déjà validée${validatedCount > 1 ? 's' : ''}`
          : `${savedRecord.transactions.length} transactions chargées, ${matches.length} correspondances`
      );
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, step: 'upload' }));
      showError('Erreur lors du chargement des données sauvegardées');
    }
  }, [savedRecord, runLocalMatching, showSuccess, showError]);

  const importBankStatement = useCallback(async (file: File, year: string, month: string) => {
    setState(prev => ({ ...prev, isParsing: true, step: 'parsing', pdfFileName: file.name }));

    try {
      // Upload le PDF dans Supabase Storage
      let pdfUrl: string | null = null;
      try {
        pdfUrl = await RapprochementService.uploadBankStatementPdf(file, companyId, year, month);
      } catch (e) {
        console.warn('Failed to upload PDF to storage, continuing without:', e);
      }

      const images = await RapprochementService.pdfToImages(file);
      if (images.length === 0) throw new Error('Le PDF semble vide ou illisible.');

      const transactions = await RapprochementService.analyzeWithAI(images, year, month);
      if (transactions.length === 0) throw new Error('Aucune transaction trouvée dans le relevé.');

      // Sauvegarder transactions + PDF URL immédiatement
      if (user?.id) {
        const tempStats = RapprochementService.calculateStats(transactions, [], []);
        await RapprochementService.saveRapprochement(
          companyId, year, month, file.name, tempStats, user.id, transactions, [], pdfUrl || undefined
        );
      }

      const { matches, stats } = await runLocalMatching(transactions, year, month, file.name);

      // Mettre à jour le pdfUrl dans le state
      setState(prev => ({ ...prev, pdfUrl }));

      // Sauvegarder avec les matches
      if (user?.id) {
        await RapprochementService.saveRapprochement(
          companyId, year, month, file.name, stats, user.id, transactions, matches, pdfUrl || undefined
        );
      }

      setHasSavedData(true);
      showSuccess(`${transactions.length} transactions analysées, ${matches.length} correspondances`);
      return { transactions, matches, stats };
    } catch (error) {
      setState(prev => ({ ...prev, isParsing: false, isLoading: false, step: 'upload' }));
      showError(error instanceof Error ? error.message : 'Erreur lors de l\'analyse');
      throw error;
    }
  }, [companyId, user, runLocalMatching, showSuccess, showError]);

  const addManualMatch = useCallback((invoiceId: string, transactionId: string) => {
    const invoice = state.unmatchedInvoices.find((inv: FileItem) => inv.id === invoiceId);
    const transaction = state.unmatchedTransactions.find(t => t.id === transactionId);
    if (!invoice || !transaction) { showError('Correspondance invalide'); return; }

    const newMatch: RapprochementMatch = {
      id: crypto.randomUUID(),
      transactionId, invoiceId,
      transactionAmount: transaction.amount,
      invoiceAmount: invoice.amount || 0,
      difference: Math.abs((invoice.amount || 0) - transaction.amount),
      confidence: 'manual',
      isValidated: false,
      invoiceName: invoice.name, invoiceUrl: invoice.url, invoiceType: invoice.type,
      transactionDescription: transaction.description,
      transactionDate: transaction.date, invoiceDate: invoice.document_date
    };

    transaction.isMatched = true;

    setState(prev => {
      const newMatches = [...prev.matches, newMatch];
      const newUnmatchedTransactions = prev.unmatchedTransactions.filter(t => t.id !== transactionId);
      const newUnmatchedInvoices = prev.unmatchedInvoices.filter((inv: FileItem) => inv.id !== invoiceId);
      const stats = RapprochementService.calculateStats(
        prev.transactions, [...prev.unmatchedInvoices, ...prev.matches.map(() => ({} as FileItem))], newMatches
      );
      return { ...prev, matches: newMatches, unmatchedTransactions: newUnmatchedTransactions, unmatchedInvoices: newUnmatchedInvoices, stats };
    });
    showSuccess('Correspondance manuelle ajoutée');
  }, [state.unmatchedInvoices, state.unmatchedTransactions, showSuccess, showError]);

  const removeMatch = useCallback((matchId: string) => {
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return;
    const transaction = state.transactions.find(t => t.id === match.transactionId);
    if (transaction) transaction.isMatched = false;

    setState(prev => ({
      ...prev,
      matches: prev.matches.filter(m => m.id !== matchId),
      unmatchedTransactions: prev.transactions.filter(t => !t.isMatched)
    }));
    showSuccess('Correspondance supprimée');
  }, [state.matches, state.transactions, showSuccess]);

  /**
   * Valide un match individuel et sauvegarde en base
   */
  const validateMatch = useCallback(async (matchId: string, year?: string, month?: string) => {
    setState(prev => {
      const newMatches = prev.matches.map(m => m.id === matchId ? { ...m, isValidated: true } : m);

      // Sauvegarder silencieusement si on a les infos
      if (year && month) {
        persistMatches(newMatches, prev.transactions, prev.stats, prev.pdfFileName || 'releve.pdf', year, month);
      }

      return { ...prev, matches: newMatches };
    });
  }, [persistMatches]);

  /**
   * Valide tous les rapprochements et sauvegarde
   */
  const validateAll = useCallback(async (year: string, month: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const validatedMatches = state.matches.map(m => ({ ...m, isValidated: true }));

      if (user?.id) {
        await RapprochementService.saveRapprochement(
          companyId, year, month,
          state.pdfFileName || 'releve.pdf',
          state.stats, user.id, state.transactions, validatedMatches
        );
      }

      setState(prev => ({
        ...prev,
        matches: validatedMatches,
        isLoading: false,
        step: 'validated'
      }));
      showSuccess('Rapprochement validé et sauvegardé');
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      showError('Erreur lors de la validation');
    }
  }, [companyId, user, state.pdfFileName, state.stats, state.transactions, state.matches, showSuccess, showError]);

  const rerunMatching = useCallback(async (year: string, month: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // Préserver les matches validés
      const validatedMatches = state.matches.filter(m => m.isValidated);
      const { matches } = await runLocalMatching(
        state.transactions, year, month, state.pdfFileName || 'releve.pdf', validatedMatches
      );

      // Sauvegarder
      if (user?.id) {
        const invoices = await RapprochementService.getInvoicesForMonth(companyId, year, month);
        const stats = RapprochementService.calculateStats(state.transactions, invoices, matches);
        await RapprochementService.saveRapprochement(
          companyId, year, month, state.pdfFileName || 'releve.pdf', stats, user.id, state.transactions, matches
        );
      }

      showSuccess(`Rapprochement relancé : ${matches.length} correspondances`);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      showError('Erreur lors du re-rapprochement');
    }
  }, [companyId, user, state.transactions, state.matches, state.pdfFileName, runLocalMatching, showSuccess, showError]);

  const recheckTransactions = useCallback(async (
    transactionsToCheck: BankTransaction[], year: string, month: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const invoices = await RapprochementService.getInvoicesForMonth(companyId, year, month);
      const matchedInvoiceIds = new Set(state.matches.map(m => m.invoiceId));
      const availableInvoices = invoices.filter(inv => !matchedInvoiceIds.has(inv.id));
      const txToCheck = transactionsToCheck.map(t => ({ ...t, isMatched: false }));
      const newMatches = RapprochementService.findMatches(availableInvoices, txToCheck);

      if (newMatches.length > 0) {
        setState(prev => {
          const newMatchedTxIds = new Set(newMatches.map(m => m.transactionId));
          const newMatchedInvIds = new Set(newMatches.map(m => m.invoiceId));
          const allMatches = [...prev.matches, ...newMatches];
          const updatedTx = prev.transactions.map(t => newMatchedTxIds.has(t.id) ? { ...t, isMatched: true } : t);
          const unmatchedTx = updatedTx.filter(t => !t.isMatched);
          const unmatchedInv = prev.unmatchedInvoices.filter((inv: FileItem) => !newMatchedInvIds.has(inv.id));
          const stats = RapprochementService.calculateStats(updatedTx, invoices, allMatches);

          // Sauvegarder
          if (user?.id) {
            RapprochementService.saveRapprochement(
              companyId, year, month, prev.pdfFileName || 'releve.pdf', stats, user.id, updatedTx, allMatches
            );
          }

          return { ...prev, transactions: updatedTx, matches: allMatches, unmatchedTransactions: unmatchedTx, unmatchedInvoices: unmatchedInv, stats, isLoading: false };
        });
        showSuccess(`${newMatches.length} nouvelle${newMatches.length > 1 ? 's' : ''} correspondance${newMatches.length > 1 ? 's' : ''}`);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        showSuccess('Aucune nouvelle correspondance');
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      showError('Erreur lors de la revérification');
    }
  }, [companyId, user, state.matches, showSuccess, showError]);

  /**
   * Cherche des correspondances dans le mois précédent.
   * Si trouvées, déplace les factures vers le mois courant avec la date de la transaction.
   */
  const recheckPreviousMonth = useCallback(async (
    transactionsToCheck: BankTransaction[], year: string, month: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { year: prevYear, month: prevMonth } = RapprochementService.getPreviousMonth(year, month);
      const prevInvoices = await RapprochementService.getInvoicesForMonth(companyId, prevYear, prevMonth);

      if (prevInvoices.length === 0) {
        setState(prev => ({ ...prev, isLoading: false }));
        showSuccess(`Aucune facture trouvée en ${prevMonth}/${prevYear}`);
        return;
      }

      const txToCheck = transactionsToCheck.map(t => ({ ...t, isMatched: false }));
      const newMatches = RapprochementService.findMatches(prevInvoices, txToCheck);

      if (newMatches.length === 0) {
        setState(prev => ({ ...prev, isLoading: false }));
        showSuccess(`Aucune correspondance trouvée sur ${prevMonth}/${prevYear}`);
        return;
      }

      // Déplacer chaque facture trouvée vers le mois courant
      for (const match of newMatches) {
        const tx = transactionsToCheck.find(t => t.id === match.transactionId);
        const docDate = tx?.date || new Date(parseInt(year), parseInt(month) - 1, 15).toISOString().split('T')[0];
        await RapprochementService.moveInvoiceToMonth(match.invoiceId, year, month, docDate);
      }

      // Relancer le matching complet sur le mois courant
      const validatedMatches = state.matches.filter(m => m.isValidated);
      const { matches: allMatches } = await runLocalMatching(
        state.transactions, year, month, state.pdfFileName || 'releve.pdf', validatedMatches
      );

      // Sauvegarder
      if (user?.id) {
        const invoices = await RapprochementService.getInvoicesForMonth(companyId, year, month);
        const stats = RapprochementService.calculateStats(state.transactions, invoices, allMatches);
        await RapprochementService.saveRapprochement(
          companyId, year, month, state.pdfFileName || 'releve.pdf', stats, user.id, state.transactions, allMatches
        );
      }

      showSuccess(`${newMatches.length} facture${newMatches.length > 1 ? 's' : ''} trouvée${newMatches.length > 1 ? 's' : ''} en ${prevMonth}/${prevYear} et déplacée${newMatches.length > 1 ? 's' : ''} vers ${month}/${year}`);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      showError('Erreur lors de la recherche sur le mois précédent');
    }
  }, [companyId, user, state.matches, state.transactions, state.pdfFileName, runLocalMatching, showSuccess, showError]);

  const createInvoiceFromTransaction = useCallback(async (
    transaction: BankTransaction, year: string, month: string
  ) => {
    if (!user?.id || !companyId) return;
    try {
      await RapprochementService.createInvoiceFromTransaction(transaction, companyId, user.id, year, month);
      const prefix = transaction.type === 'debit' ? 'ACH' : 'VTE';
      showSuccess(`Facture "${prefix} - ${transaction.description.substring(0, 30)}" créée`);
    } catch (error) {
      showError('Erreur lors de la création de la facture');
      throw error;
    }
  }, [companyId, user, showSuccess, showError]);

  const createAllUnmatchedInvoices = useCallback(async (year: string, month: string) => {
    if (!user?.id || !companyId) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const count = await RapprochementService.createInvoicesFromTransactions(
        state.unmatchedTransactions, companyId, user.id, year, month
      );
      showSuccess(`${count} facture${count > 1 ? 's' : ''} créée${count > 1 ? 's' : ''}`);

      const validatedMatches = state.matches.filter(m => m.isValidated);
      await runLocalMatching(state.transactions, year, month, state.pdfFileName || 'releve.pdf', validatedMatches);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      showError('Erreur lors de la création des factures');
    }
  }, [companyId, user, state.unmatchedTransactions, state.transactions, state.matches, state.pdfFileName, runLocalMatching, showSuccess, showError]);

  const reset = useCallback(() => {
    setState(initialState);
    setHasSavedData(false);
    setSavedRecord(null);
  }, []);

  return {
    ...state,
    hasSavedData,
    savedRecord,
    importBankStatement,
    checkForSavedData,
    loadSavedData,
    addManualMatch,
    removeMatch,
    validateMatch,
    validateAll,
    rerunMatching,
    recheckTransactions,
    recheckPreviousMonth,
    createInvoiceFromTransaction,
    createAllUnmatchedInvoices,
    reset
  };
}
