import { useState, useEffect } from 'react';
import { BudgetService } from '../lib/services/budgetService';
import { BudgetExpenseCategoryService } from '../lib/services/budgetExpenseCategoryService';
import type { BudgetWithStats, BudgetAlert, CreateBudgetForm, Budget } from '../types/budget';
import { useToast } from './useToast';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

export function useBudgets() {
  const [budgets, setBudgets] = useState<BudgetWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();

  // Récupérer les budgets
  const loadBudgets = async () => {
    if (!selectedCompany) return;
    
    try {
      setLoading(true);
      const budgetsData = await BudgetService.getBudgetsByCompany(selectedCompany.id);
      setBudgets(budgetsData);
      
      // Charger les alertes
      const alertsData = await BudgetService.getBudgetAlerts(selectedCompany.id);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Erreur lors du chargement des budgets:', error);
      showError('Erreur lors du chargement des budgets');
    } finally {
      setLoading(false);
    }
  };

  // Créer un budget
  const createBudget = async (budgetData: CreateBudgetForm, categoryIds?: string[]): Promise<Budget | null> => {
    if (!selectedCompany || !user) return null;

    try {
      console.log('🔄 Création du budget avec postes de dépenses:', { budgetData, categoryIds });
      
      const newBudget = await BudgetService.createBudget(
        selectedCompany.id,
        user.id,
        budgetData
      );
      
      // Si des postes de dépenses sont sélectionnés, les assigner au budget
      if (categoryIds && categoryIds.length > 0 && newBudget) {
        console.log('🔄 Assignation des postes de dépenses au nouveau budget');
        await BudgetExpenseCategoryService.updateBudgetExpenseCategories(
          newBudget.id,
          categoryIds,
          user.id
        );
      }
      
      showSuccess('Budget créé avec succès');
      await loadBudgets(); // Recharger la liste
      return newBudget;
    } catch (error) {
      console.error('Erreur lors de la création du budget:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de la création du budget');
      return null;
    }
  };

  // Mettre à jour un budget
  const updateBudget = async (budgetId: string, updates: Partial<CreateBudgetForm>): Promise<boolean> => {
    try {
      await BudgetService.updateBudget(budgetId, updates);
      showSuccess('Budget mis à jour avec succès');
      await loadBudgets(); // Recharger la liste
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du budget:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du budget');
      return false;
    }
  };

  // Archiver un budget
  const archiveBudget = async (budgetId: string): Promise<boolean> => {
    try {
      await BudgetService.archiveBudget(budgetId);
      showSuccess('Budget archivé avec succès');
      await loadBudgets(); // Recharger la liste
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'archivage du budget:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de l\'archivage du budget');
      return false;
    }
  };

  // Supprimer un budget
  const deleteBudget = async (budgetId: string): Promise<boolean> => {
    try {
      await BudgetService.deleteBudget(budgetId);
      showSuccess('Budget supprimé avec succès');
      await loadBudgets(); // Recharger la liste
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du budget:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de la suppression du budget');
      return false;
    }
  };

  // Réactiver un budget
  const reactivateBudget = async (budgetId: string): Promise<boolean> => {
    try {
      await BudgetService.reactivateBudget(budgetId);
      showSuccess('Budget réactivé avec succès');
      await loadBudgets(); // Recharger la liste
      return true;
    } catch (error) {
      console.error('Erreur lors de la réactivation du budget:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de la réactivation du budget');
      return false;
    }
  };

  // Récupérer un budget par ID
  const getBudgetById = async (budgetId: string): Promise<BudgetWithStats | null> => {
    try {
      return await BudgetService.getBudgetById(budgetId);
    } catch (error) {
      console.error('Erreur lors de la récupération du budget:', error);
      showError('Erreur lors de la récupération du budget');
      return null;
    }
  };

  // Charger les budgets au montage et quand l'entreprise change
  useEffect(() => {
    loadBudgets();
  }, [selectedCompany]);

  return {
    budgets,
    alerts,
    loading,
    createBudget,
    updateBudget,
    archiveBudget,
    deleteBudget,
    reactivateBudget,
    getBudgetById,
    refreshBudgets: loadBudgets
  };
}
