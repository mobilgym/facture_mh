import { useState, useEffect } from 'react';
import { ExpenseCategoryService } from '../lib/services/expenseCategoryService';
import type { ExpenseCategory, ExpenseCategoryWithStats, CreateExpenseCategoryForm } from '../types/budget';
import { useToast } from './useToast';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategoryWithStats[]>([]);
  const [activeCategories, setActiveCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();

  // Récupérer les postes de dépenses avec statistiques
  const loadCategories = async () => {
    if (!selectedCompany) return;
    
    try {
      setLoading(true);
      const categoriesData = await ExpenseCategoryService.getCategoriesByCompany(selectedCompany.id);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur lors du chargement des postes de dépenses:', error);
      showError('Erreur lors du chargement des postes de dépenses');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les postes actifs (pour les sélecteurs)
  const loadActiveCategories = async () => {
    if (!selectedCompany) return;
    
    try {
      const activeCategoriesData = await ExpenseCategoryService.getActiveCategories(selectedCompany.id);
      setActiveCategories(activeCategoriesData);
    } catch (error) {
      console.error('Erreur lors du chargement des postes actifs:', error);
      showError('Erreur lors du chargement des postes actifs');
    }
  };

  // Créer un poste de dépense
  const createCategory = async (categoryData: CreateExpenseCategoryForm): Promise<ExpenseCategory | null> => {
    if (!selectedCompany || !user) return null;

    try {
      const newCategory = await ExpenseCategoryService.createCategory(
        selectedCompany.id,
        user.id,
        categoryData
      );
      
      showSuccess('Poste de dépense créé avec succès');
      await loadCategories(); // Recharger la liste avec stats
      await loadActiveCategories(); // Recharger la liste active
      return newCategory;
    } catch (error) {
      console.error('Erreur lors de la création du poste de dépense:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de la création du poste de dépense');
      return null;
    }
  };

  // Mettre à jour un poste de dépense
  const updateCategory = async (categoryId: string, updates: Partial<CreateExpenseCategoryForm>): Promise<boolean> => {
    try {
      await ExpenseCategoryService.updateCategory(categoryId, updates);
      showSuccess('Poste de dépense mis à jour avec succès');
      await loadCategories(); // Recharger la liste avec stats
      await loadActiveCategories(); // Recharger la liste active
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du poste de dépense:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du poste de dépense');
      return false;
    }
  };

  // Archiver un poste de dépense
  const archiveCategory = async (categoryId: string): Promise<boolean> => {
    try {
      await ExpenseCategoryService.archiveCategory(categoryId);
      showSuccess('Poste de dépense archivé avec succès');
      await loadCategories(); // Recharger la liste avec stats
      await loadActiveCategories(); // Recharger la liste active
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'archivage du poste de dépense:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de l\'archivage du poste de dépense');
      return false;
    }
  };

  // Supprimer un poste de dépense
  const deleteCategory = async (categoryId: string): Promise<boolean> => {
    try {
      await ExpenseCategoryService.deleteCategory(categoryId);
      showSuccess('Poste de dépense supprimé avec succès');
      await loadCategories(); // Recharger la liste avec stats
      await loadActiveCategories(); // Recharger la liste active
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du poste de dépense:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de la suppression du poste de dépense');
      return false;
    }
  };

  // Réactiver un poste de dépense
  const reactivateCategory = async (categoryId: string): Promise<boolean> => {
    try {
      await ExpenseCategoryService.reactivateCategory(categoryId);
      showSuccess('Poste de dépense réactivé avec succès');
      await loadCategories(); // Recharger la liste avec stats
      await loadActiveCategories(); // Recharger la liste active
      return true;
    } catch (error) {
      console.error('Erreur lors de la réactivation du poste de dépense:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de la réactivation du poste de dépense');
      return false;
    }
  };

  // Récupérer un poste par ID
  const getCategoryById = async (categoryId: string): Promise<ExpenseCategory | null> => {
    try {
      return await ExpenseCategoryService.getCategoryById(categoryId);
    } catch (error) {
      console.error('Erreur lors de la récupération du poste de dépense:', error);
      showError('Erreur lors de la récupération du poste de dépense');
      return null;
    }
  };

  // Obtenir les couleurs par défaut
  const getDefaultColors = () => {
    return ExpenseCategoryService.getDefaultColors();
  };

  // Obtenir une couleur aléatoire
  const getRandomColor = () => {
    return ExpenseCategoryService.getRandomColor();
  };

  // Charger les données au montage et quand l'entreprise change
  useEffect(() => {
    if (selectedCompany) {
      loadCategories();
      loadActiveCategories();
    }
  }, [selectedCompany]);

  return {
    categories,
    activeCategories,
    loading,
    createCategory,
    updateCategory,
    archiveCategory,
    deleteCategory,
    reactivateCategory,
    getCategoryById,
    getDefaultColors,
    getRandomColor,
    refreshCategories: () => {
      loadCategories();
      loadActiveCategories();
    }
  };
}
