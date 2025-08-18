import { supabase } from '../supabase';

/**
 * Service pour gérer les relations entre budgets et postes de dépenses
 */
export class BudgetExpenseCategoryService {
  /**
   * Récupère tous les postes de dépenses d'un budget
   */
  static async getExpenseCategoriesByBudget(budgetId: string) {
    try {
      console.log('🔍 Récupération des postes de dépenses pour le budget:', budgetId);

      // Récupérer d'abord les catégories associées au budget
      const { data: links, error: linksError } = await supabase
        .from('budget_expense_categories')
        .select('expense_category_id')
        .eq('budget_id', budgetId);

      if (linksError) {
        console.error('❌ Erreur lors de la récupération des liens:', linksError);
        throw new Error(`Erreur lors de la récupération des liens: ${linksError.message}`);
      }

      if (!links || links.length === 0) {
        console.log('ℹ️ Aucun poste de dépense associé à ce budget');
        return [];
      }

      // Récupérer les détails des catégories
      const categoryIds = links.map(link => link.expense_category_id);
      const { data: categories, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('id, name, description, color')
        .in('id', categoryIds)
        .eq('is_active', true);

      if (categoriesError) {
        console.error('❌ Erreur lors de la récupération des postes de dépenses:', categoriesError);
        throw new Error(`Erreur lors de la récupération des postes de dépenses: ${categoriesError.message}`);
      }

      console.log('✅ Postes de dépenses récupérés:', categories?.length || 0);
      return categories || [];
    } catch (error) {
      console.error('❌ Erreur dans getExpenseCategoriesByBudget:', error);
      throw error;
    }
  }

  /**
   * Assigne un poste de dépense à un budget
   */
  static async assignExpenseCategory(budgetId: string, categoryId: string, userId: string) {
    try {
      console.log('📝 Assignation du poste de dépense au budget:', { budgetId, categoryId });

      const { error } = await supabase
        .from('budget_expense_categories')
        .insert({
          budget_id: budgetId,
          expense_category_id: categoryId,
          created_by: userId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log('ℹ️ Ce poste de dépense est déjà assigné à ce budget');
          return;
        }
        console.error('❌ Erreur lors de l\'assignation du poste de dépense:', error);
        throw new Error(`Erreur lors de l'assignation du poste de dépense: ${error.message}`);
      }

      console.log('✅ Poste de dépense assigné avec succès');
    } catch (error) {
      console.error('❌ Erreur dans assignExpenseCategory:', error);
      throw error;
    }
  }

  /**
   * Retire un poste de dépense d'un budget
   */
  static async removeExpenseCategory(budgetId: string, categoryId: string) {
    try {
      console.log('🗑️ Retrait du poste de dépense du budget:', { budgetId, categoryId });

      const { error } = await supabase
        .from('budget_expense_categories')
        .delete()
        .eq('budget_id', budgetId)
        .eq('expense_category_id', categoryId);

      if (error) {
        console.error('❌ Erreur lors du retrait du poste de dépense:', error);
        throw new Error(`Erreur lors du retrait du poste de dépense: ${error.message}`);
      }

      console.log('✅ Poste de dépense retiré avec succès');
    } catch (error) {
      console.error('❌ Erreur dans removeExpenseCategory:', error);
      throw error;
    }
  }

  /**
   * Met à jour les postes de dépenses d'un budget
   */
  static async updateBudgetExpenseCategories(budgetId: string, categoryIds: string[], userId: string) {
    try {
      console.log('📝 Mise à jour des postes de dépenses du budget:', { budgetId, categoryIds });

      // Supprimer toutes les relations existantes
      const { error: deleteError } = await supabase
        .from('budget_expense_categories')
        .delete()
        .eq('budget_id', budgetId);

      if (deleteError) {
        throw deleteError;
      }

      // Ajouter les nouvelles relations
      if (categoryIds.length > 0) {
        const { error: insertError } = await supabase
          .from('budget_expense_categories')
          .insert(
            categoryIds.map(categoryId => ({
              budget_id: budgetId,
              expense_category_id: categoryId,
              created_by: userId
            }))
          );

        if (insertError) {
          throw insertError;
        }
      }

      console.log('✅ Postes de dépenses mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur dans updateBudgetExpenseCategories:', error);
      throw error;
    }
  }
}
