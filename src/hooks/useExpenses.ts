import { useState, useEffect, useCallback } from 'react';
import { ExpenseService } from '../lib/services/expenseService';
import type { 
  ExpenseWithDetails, 
  CreateExpenseForm, 
  ExpenseAnalysis,
  ExpenseStatus,
  Expense 
} from '../types/budget';
import { useToast } from './useToast';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

interface UseExpensesOptions {
  budgetId?: string;
  categoryId?: string;
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<ExpenseAnalysis | null>(null);
  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();

  // Récupérer les dépenses
  const loadExpenses = useCallback(async () => {
    if (!selectedCompany) return;
    
    try {
      setLoading(true);
      let expensesData: ExpenseWithDetails[];
      
      if (options.budgetId) {
        console.log('🔍 Chargement des dépenses pour le budget:', options.budgetId);
        expensesData = await ExpenseService.getExpensesByBudget(options.budgetId);
      } else if (options.categoryId) {
        console.log('🔍 Chargement des dépenses pour la catégorie:', options.categoryId);
        expensesData = await ExpenseService.getExpensesByCategory(options.categoryId);
      } else {
        console.log('🔍 Chargement de toutes les dépenses de l\'entreprise:', selectedCompany.id);
        expensesData = await ExpenseService.getExpensesByCompany(selectedCompany.id);
      }
      
      console.log('✅ Dépenses chargées:', expensesData.length);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Erreur lors du chargement des dépenses:', error);
      showError('Erreur lors du chargement des dépenses');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, options.budgetId, options.categoryId, showError]);

  // Récupérer les dépenses d'un budget spécifique
  const loadExpensesByBudget = async (budgetId: string): Promise<ExpenseWithDetails[]> => {
    try {
      return await ExpenseService.getExpensesByBudget(budgetId);
    } catch (error) {
      console.error('Erreur lors du chargement des dépenses du budget:', error);
      showError('Erreur lors du chargement des dépenses du budget');
      return [];
    }
  };

  // Récupérer les dépenses d'un poste spécifique
  const loadExpensesByCategory = async (categoryId: string): Promise<ExpenseWithDetails[]> => {
    try {
      return await ExpenseService.getExpensesByCategory(categoryId);
    } catch (error) {
      console.error('Erreur lors du chargement des dépenses du poste:', error);
      showError('Erreur lors du chargement des dépenses du poste');
      return [];
    }
  };

  // Créer une dépense
  const createExpense = async (expenseData: CreateExpenseForm, fileId?: string): Promise<Expense | null> => {
    if (!selectedCompany || !user) return null;

    try {
      const newExpense = await ExpenseService.createExpense(
        selectedCompany.id,
        user.id,
        expenseData,
        fileId
      );
      
      showSuccess('Dépense créée avec succès');
      await loadExpenses(); // Recharger la liste
      return newExpense;
    } catch (error) {
      console.error('Erreur lors de la création de la dépense:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors de la création de la dépense'
      );
      return null;
    }
  };

  // Mettre à jour une dépense
  const updateExpense = async (
    expenseId: string, 
    updates: Partial<CreateExpenseForm & { status: ExpenseStatus }>
  ): Promise<boolean> => {
    try {
      await ExpenseService.updateExpense(expenseId, updates);
      showSuccess('Dépense mise à jour avec succès');
      await loadExpenses(); // Recharger la liste
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dépense:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la dépense'
      );
      return false;
    }
  };

  // Supprimer une dépense
  const deleteExpense = async (expenseId: string): Promise<boolean> => {
    try {
      await ExpenseService.deleteExpense(expenseId);
      showSuccess('Dépense supprimée avec succès');
      await loadExpenses(); // Recharger la liste
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors de la suppression de la dépense'
      );
      return false;
    }
  };

  // Approuver une dépense
  const approveExpense = async (expenseId: string): Promise<boolean> => {
    try {
      await ExpenseService.approveExpense(expenseId);
      showSuccess('Dépense approuvée avec succès');
      await loadExpenses(); // Recharger la liste
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'approbation de la dépense:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors de l\'approbation de la dépense'
      );
      return false;
    }
  };

  // Marquer comme payée
  const markAsPaid = async (expenseId: string): Promise<boolean> => {
    try {
      await ExpenseService.markAsPaid(expenseId);
      showSuccess('Dépense marquée comme payée');
      await loadExpenses(); // Recharger la liste
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage comme payée:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors du marquage comme payée'
      );
      return false;
    }
  };

  // Lier un fichier à une dépense
  const attachFileToExpense = async (expenseId: string, fileId: string): Promise<boolean> => {
    try {
      await ExpenseService.attachFileToExpense(expenseId, fileId);
      showSuccess('Fichier lié à la dépense avec succès');
      await loadExpenses(); // Recharger la liste
      return true;
    } catch (error) {
      console.error('Erreur lors de la liaison du fichier:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors de la liaison du fichier'
      );
      return false;
    }
  };

  // Détacher un fichier d'une dépense
  const detachFileFromExpense = async (expenseId: string): Promise<boolean> => {
    try {
      await ExpenseService.detachFileFromExpense(expenseId);
      showSuccess('Fichier détaché de la dépense avec succès');
      await loadExpenses(); // Recharger la liste
      return true;
    } catch (error) {
      console.error('Erreur lors du détachement du fichier:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors du détachement du fichier'
      );
      return false;
    }
  };

  // Récupérer une dépense par ID
  const getExpenseById = async (expenseId: string): Promise<ExpenseWithDetails | null> => {
    try {
      return await ExpenseService.getExpenseById(expenseId);
    } catch (error) {
      console.error('Erreur lors de la récupération de la dépense:', error);
      showError('Erreur lors de la récupération de la dépense');
      return null;
    }
  };

  // Générer une analyse des dépenses
  const generateAnalysis = async (startDate?: string, endDate?: string): Promise<void> => {
    if (!selectedCompany) return;

    try {
      const analysisData = await ExpenseService.getExpenseAnalysis(
        selectedCompany.id,
        startDate,
        endDate
      );
      setAnalysis(analysisData);
    } catch (error) {
      console.error('Erreur lors de la génération de l\'analyse:', error);
      showError('Erreur lors de la génération de l\'analyse');
    }
  };

  // Charger les dépenses au montage et quand l'entreprise change ou les options changent
  useEffect(() => {
    if (selectedCompany) {
      loadExpenses();
      if (!options.budgetId && !options.categoryId) {
        generateAnalysis(); // Générer l'analyse par défaut seulement pour toutes les dépenses
      }
    }
  }, [selectedCompany, options.budgetId, options.categoryId]);

  return {
    expenses,
    analysis,
    loading,
    createExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    markAsPaid,
    attachFileToExpense,
    detachFileFromExpense,
    getExpenseById,
    loadExpensesByBudget,
    loadExpensesByCategory,
    generateAnalysis,
    refreshExpenses: loadExpenses
  };
}
