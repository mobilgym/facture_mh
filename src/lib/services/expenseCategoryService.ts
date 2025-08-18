import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';
import type { ExpenseCategory, ExpenseCategoryWithStats, CreateExpenseCategoryForm } from '../../types/budget';

type ExpenseCategoryRow = Database['public']['Tables']['expense_categories']['Row'];
type ExpenseCategoryInsert = Database['public']['Tables']['expense_categories']['Insert'];
type ExpenseCategoryUpdate = Database['public']['Tables']['expense_categories']['Update'];

/**
 * Service pour gérer les postes de dépenses
 */
export class ExpenseCategoryService {
  /**
   * Récupère tous les postes de dépenses d'une entreprise
   */
  static async getCategoriesByCompany(companyId: string): Promise<ExpenseCategoryWithStats[]> {
    try {
      console.log('🔍 Récupération des postes de dépenses pour l\'entreprise:', companyId);

      const { data: categories, error } = await supabase
        .from('expense_categories')
        .select(`
          *,
          expenses!expenses_expense_category_id_fkey (
            id,
            amount,
            status
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des postes de dépenses:', error);
        throw new Error(`Erreur lors de la récupération des postes de dépenses: ${error.message}`);
      }

      // Calculer le total des dépenses pour le calcul des pourcentages
      let totalAmount = 0;
      const categoriesData = categories?.map((category: any) => {
        const expenses = category.expenses || [];
        const paidExpenses = expenses.filter((exp: any) => 
          exp.status === 'approved' || exp.status === 'paid'
        );
        
        const categoryTotal = paidExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
        totalAmount += categoryTotal;

        return {
          ...category,
          total_amount: categoryTotal,
          expenses_count: paidExpenses.length,
          percentage_of_total: 0 // Sera calculé après
        };
      }) || [];

      // Calculer les pourcentages
      const categoriesWithStats: ExpenseCategoryWithStats[] = categoriesData.map(category => ({
        ...category,
        percentage_of_total: totalAmount > 0 
          ? Math.round((category.total_amount / totalAmount) * 100 * 100) / 100 
          : 0
      }));

      console.log('✅ Postes de dépenses récupérés avec succès:', categoriesWithStats.length);
      return categoriesWithStats;
    } catch (error) {
      console.error('❌ Erreur dans getCategoriesByCompany:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les postes de dépenses actifs (pour les sélecteurs)
   */
  static async getActiveCategories(companyId: string): Promise<ExpenseCategory[]> {
    try {
      console.log('🔍 Récupération des postes de dépenses actifs pour l\'entreprise:', companyId);

      const { data: categories, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des postes actifs:', error);
        throw new Error(`Erreur lors de la récupération des postes actifs: ${error.message}`);
      }

      console.log('✅ Postes de dépenses actifs récupérés:', categories?.length || 0);
      return categories || [];
    } catch (error) {
      console.error('❌ Erreur dans getActiveCategories:', error);
      throw error;
    }
  }

  /**
   * Récupère un poste de dépense par ID
   */
  static async getCategoryById(categoryId: string): Promise<ExpenseCategory | null> {
    try {
      console.log('🔍 Récupération du poste de dépense:', categoryId);

      const { data: category, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('❌ Erreur lors de la récupération du poste de dépense:', error);
        throw new Error(`Erreur lors de la récupération du poste de dépense: ${error.message}`);
      }

      console.log('✅ Poste de dépense récupéré avec succès');
      return category;
    } catch (error) {
      console.error('❌ Erreur dans getCategoryById:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau poste de dépense
   */
  static async createCategory(
    companyId: string, 
    userId: string, 
    categoryData: CreateExpenseCategoryForm
  ): Promise<ExpenseCategory> {
    try {
      console.log('📝 Création d\'un nouveau poste de dépense:', categoryData);

      const categoryInsert: ExpenseCategoryInsert = {
        company_id: companyId,
        created_by: userId,
        name: categoryData.name,
        description: categoryData.description || null,
        color: categoryData.color,
        is_active: true
      };

      const { data: category, error } = await supabase
        .from('expense_categories')
        .insert(categoryInsert)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création du poste de dépense:', error);
        if (error.code === '23505') {
          throw new Error('Un poste de dépense avec ce nom existe déjà dans cette entreprise');
        }
        throw new Error(`Erreur lors de la création du poste de dépense: ${error.message}`);
      }

      console.log('✅ Poste de dépense créé avec succès:', category.id);
      return category;
    } catch (error) {
      console.error('❌ Erreur dans createCategory:', error);
      throw error;
    }
  }

  /**
   * Met à jour un poste de dépense
   */
  static async updateCategory(
    categoryId: string, 
    updates: Partial<CreateExpenseCategoryForm>
  ): Promise<ExpenseCategory> {
    try {
      console.log('📝 Mise à jour du poste de dépense:', categoryId, updates);

      const categoryUpdate: ExpenseCategoryUpdate = {
        name: updates.name,
        description: updates.description !== undefined ? updates.description : undefined,
        color: updates.color
      };

      const { data: category, error } = await supabase
        .from('expense_categories')
        .update(categoryUpdate)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du poste de dépense:', error);
        if (error.code === '23505') {
          throw new Error('Un poste de dépense avec ce nom existe déjà dans cette entreprise');
        }
        throw new Error(`Erreur lors de la mise à jour du poste de dépense: ${error.message}`);
      }

      console.log('✅ Poste de dépense mis à jour avec succès');
      return category;
    } catch (error) {
      console.error('❌ Erreur dans updateCategory:', error);
      throw error;
    }
  }

  /**
   * Archive un poste de dépense (désactive au lieu de supprimer)
   */
  static async archiveCategory(categoryId: string): Promise<void> {
    try {
      console.log('🗂️ Archivage du poste de dépense:', categoryId);

      const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: false })
        .eq('id', categoryId);

      if (error) {
        console.error('❌ Erreur lors de l\'archivage du poste de dépense:', error);
        throw new Error(`Erreur lors de l'archivage du poste de dépense: ${error.message}`);
      }

      console.log('✅ Poste de dépense archivé avec succès');
    } catch (error) {
      console.error('❌ Erreur dans archiveCategory:', error);
      throw error;
    }
  }

  /**
   * Supprime définitivement un poste de dépense
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      console.log('🗑️ Suppression du poste de dépense:', categoryId);

      // Vérifier s'il y a des dépenses liées
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('id')
        .eq('expense_category_id', categoryId)
        .limit(1);

      if (expensesError) {
        throw new Error(`Erreur lors de la vérification des dépenses: ${expensesError.message}`);
      }

      if (expenses && expenses.length > 0) {
        throw new Error('Impossible de supprimer ce poste de dépense car il contient des dépenses. Archivez-le plutôt.');
      }

      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('❌ Erreur lors de la suppression du poste de dépense:', error);
        throw new Error(`Erreur lors de la suppression du poste de dépense: ${error.message}`);
      }

      console.log('✅ Poste de dépense supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur dans deleteCategory:', error);
      throw error;
    }
  }

  /**
   * Réactive un poste de dépense archivé
   */
  static async reactivateCategory(categoryId: string): Promise<void> {
    try {
      console.log('🔄 Réactivation du poste de dépense:', categoryId);

      const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: true })
        .eq('id', categoryId);

      if (error) {
        console.error('❌ Erreur lors de la réactivation du poste de dépense:', error);
        throw new Error(`Erreur lors de la réactivation du poste de dépense: ${error.message}`);
      }

      console.log('✅ Poste de dépense réactivé avec succès');
    } catch (error) {
      console.error('❌ Erreur dans reactivateCategory:', error);
      throw error;
    }
  }

  /**
   * Couleurs prédéfinies pour les postes de dépenses
   */
  static getDefaultColors(): string[] {
    return [
      '#EF4444', // Rouge
      '#3B82F6', // Bleu
      '#8B5CF6', // Violet
      '#10B981', // Vert
      '#F59E0B', // Orange
      '#6B7280', // Gris
      '#06B6D4', // Cyan
      '#84CC16', // Vert clair
      '#F97316', // Orange foncé
      '#64748B', // Gris foncé
      '#EC4899', // Rose
      '#14B8A6', // Teal
      '#F43F5E', // Rose vif
      '#8B5A2B', // Marron
      '#6366F1'  // Indigo
    ];
  }

  /**
   * Obtient une couleur aléatoire pour un nouveau poste
   */
  static getRandomColor(): string {
    const colors = this.getDefaultColors();
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
