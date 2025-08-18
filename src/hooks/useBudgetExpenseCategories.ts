import { useState, useEffect } from 'react';
import { BudgetExpenseCategoryService } from '../lib/services/budgetExpenseCategoryService';
import type { ExpenseCategory } from '../types/budget';
import { useToast } from './useToast';
import { useAuth } from '../contexts/AuthContext';

export function useBudgetExpenseCategories(budgetId?: string) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();

  // Charger les postes de dépenses du budget
  const loadCategories = async () => {
    if (!budgetId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const categoriesData = await BudgetExpenseCategoryService.getExpenseCategoriesByBudget(budgetId);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur lors du chargement des postes de dépenses:', error);
      showError('Erreur lors du chargement des postes de dépenses');
    } finally {
      setLoading(false);
    }
  };

  // Assigner un poste de dépense au budget
  const assignCategory = async (categoryId: string) => {
    if (!budgetId || !user) return;

    try {
      await BudgetExpenseCategoryService.assignExpenseCategory(budgetId, categoryId, user.id);
      showSuccess('Poste de dépense assigné avec succès');
      await loadCategories();
    } catch (error) {
      console.error('Erreur lors de l\'assignation du poste de dépense:', error);
      showError('Erreur lors de l\'assignation du poste de dépense');
    }
  };

  // Retirer un poste de dépense du budget
  const removeCategory = async (categoryId: string) => {
    if (!budgetId) return;

    try {
      await BudgetExpenseCategoryService.removeExpenseCategory(budgetId, categoryId);
      showSuccess('Poste de dépense retiré avec succès');
      await loadCategories();
    } catch (error) {
      console.error('Erreur lors du retrait du poste de dépense:', error);
      showError('Erreur lors du retrait du poste de dépense');
    }
  };

  // Mettre à jour tous les postes de dépenses du budget
  const updateCategories = async (categoryIds: string[]) => {
    if (!budgetId || !user) return;

    try {
      await BudgetExpenseCategoryService.updateBudgetExpenseCategories(budgetId, categoryIds, user.id);
      showSuccess('Postes de dépenses mis à jour avec succès');
      await loadCategories();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des postes de dépenses:', error);
      showError('Erreur lors de la mise à jour des postes de dépenses');
    }
  };

  // Charger les données au montage et quand le budget change
  useEffect(() => {
    loadCategories();
  }, [budgetId]);

  return {
    categories,
    loading,
    assignCategory,
    removeCategory,
    updateCategories,
    refreshCategories: loadCategories
  };
}
