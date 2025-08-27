import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';
import type { Budget, BudgetWithStats, BudgetAlert, CreateBudgetForm } from '../../types/budget';

type BudgetRow = Database['public']['Tables']['budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

/**
 * Service pour gérer les budgets
 */
export class BudgetService {
  /**
   * Récupère tous les budgets d'une entreprise
   */
  static async getBudgetsByCompany(companyId: string): Promise<BudgetWithStats[]> {
    try {
      console.log('🔍 Récupération des budgets pour l\'entreprise:', companyId);

      const { data: budgets, error } = await supabase
        .from('budgets')
        .select(`
          *,
          expenses!expenses_budget_id_fkey (
            id,
            amount,
            status
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des budgets:', error);
        throw new Error(`Erreur lors de la récupération des budgets: ${error.message}`);
      }

      // Calculer les statistiques pour chaque budget
      const budgetsWithStats: BudgetWithStats[] = budgets?.map((budget: any) => {
        const expenses = budget.expenses || [];
        const paidExpenses = expenses.filter((exp: any) => 
          exp.status === 'approved' || exp.status === 'paid'
        );
        
        const expensesCount = paidExpenses.length;
        const percentageUsed = budget.initial_amount > 0 
          ? (budget.spent_amount / budget.initial_amount) * 100 
          : 0;
        const isOverBudget = budget.spent_amount > budget.initial_amount;

        return {
          ...budget,
          expenses_count: expensesCount,
          percentage_used: Math.round(percentageUsed * 100) / 100,
          is_over_budget: isOverBudget
        };
      }) || [];

      console.log('✅ Budgets récupérés avec succès:', budgetsWithStats.length);
      return budgetsWithStats;
    } catch (error) {
      console.error('❌ Erreur dans getBudgetsByCompany:', error);
      throw error;
    }
  }

  /**
   * Récupère un budget par ID avec ses statistiques
   */
  static async getBudgetById(budgetId: string): Promise<BudgetWithStats | null> {
    try {
      console.log('🔍 Récupération du budget:', budgetId);

      const { data: budget, error } = await supabase
        .from('budgets')
        .select(`
          *,
          expenses!expenses_budget_id_fkey (
            id,
            amount,
            status
          )
        `)
        .eq('id', budgetId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('❌ Erreur lors de la récupération du budget:', error);
        throw new Error(`Erreur lors de la récupération du budget: ${error.message}`);
      }

      if (!budget) return null;

      // Calculer les statistiques
      const expenses = budget.expenses || [];
      const paidExpenses = expenses.filter((exp: any) => 
        exp.status === 'approved' || exp.status === 'paid'
      );
      
      const expensesCount = paidExpenses.length;
      const percentageUsed = budget.initial_amount > 0 
        ? (budget.spent_amount / budget.initial_amount) * 100 
        : 0;
      const isOverBudget = budget.spent_amount > budget.initial_amount;

      const budgetWithStats: BudgetWithStats = {
        ...budget,
        expenses_count: expensesCount,
        percentage_used: Math.round(percentageUsed * 100) / 100,
        is_over_budget: isOverBudget
      };

      console.log('✅ Budget récupéré avec succès');
      return budgetWithStats;
    } catch (error) {
      console.error('❌ Erreur dans getBudgetById:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau budget
   */
  static async createBudget(
    companyId: string, 
    userId: string, 
    budgetData: CreateBudgetForm
  ): Promise<Budget> {
    try {
      console.log('📝 Création d\'un nouveau budget:', budgetData);

      const budgetInsert: BudgetInsert = {
        company_id: companyId,
        created_by: userId,
        name: budgetData.name,
        description: budgetData.description || null,
        initial_amount: budgetData.initial_amount,
        spent_amount: 0,
        start_date: budgetData.start_date || null,
        end_date: budgetData.end_date || null,
        is_active: true
      };

      console.log('🔍 Tentative d\'insertion du budget avec les données:', budgetInsert);
      
      // Vérifier la connexion à Supabase
      const { data: authData } = await supabase.auth.getSession();
      console.log('🔑 Session Supabase:', authData);

      // Vérifier que la table existe
      const { data: tableInfo, error: tableError } = await supabase
        .from('budgets')
        .select('id')
        .limit(1);
      console.log('📋 Test de la table budgets:', { tableInfo, tableError });

      // Tenter l'insertion
      const { data: budget, error } = await supabase
        .from('budgets')
        .insert(budgetInsert)
        .select()
        .single();

      console.log('📝 Résultat de l\'insertion:', { budget, error });

      if (error) {
        console.error('❌ Erreur lors de la création du budget:', error);
        if (error.code === '23505') {
          throw new Error('Un budget avec ce nom existe déjà dans cette entreprise');
        }
        throw new Error(`Erreur lors de la création du budget: ${error.message}`);
      }

      console.log('✅ Budget créé avec succès:', budget.id);
      return budget;
    } catch (error) {
      console.error('❌ Erreur dans createBudget:', error);
      throw error;
    }
  }

  /**
   * Met à jour un budget
   */
  static async updateBudget(
    budgetId: string, 
    updates: Partial<CreateBudgetForm>
  ): Promise<Budget> {
    try {
      console.log('📝 Mise à jour du budget:', budgetId, updates);

      const budgetUpdate: BudgetUpdate = {
        name: updates.name,
        description: updates.description !== undefined ? updates.description : undefined,
        initial_amount: updates.initial_amount,
        start_date: updates.start_date !== undefined ? updates.start_date : undefined,
        end_date: updates.end_date !== undefined ? updates.end_date : undefined
      };

      const { data: budget, error } = await supabase
        .from('budgets')
        .update(budgetUpdate)
        .eq('id', budgetId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du budget:', error);
        if (error.code === '23505') {
          throw new Error('Un budget avec ce nom existe déjà dans cette entreprise');
        }
        throw new Error(`Erreur lors de la mise à jour du budget: ${error.message}`);
      }

      console.log('✅ Budget mis à jour avec succès');
      return budget;
    } catch (error) {
      console.error('❌ Erreur dans updateBudget:', error);
      throw error;
    }
  }

  /**
   * Archive un budget (désactive au lieu de supprimer)
   */
  static async archiveBudget(budgetId: string): Promise<void> {
    try {
      console.log('🗂️ Archivage du budget:', budgetId);

      const { error } = await supabase
        .from('budgets')
        .update({ is_active: false })
        .eq('id', budgetId);

      if (error) {
        console.error('❌ Erreur lors de l\'archivage du budget:', error);
        throw new Error(`Erreur lors de l'archivage du budget: ${error.message}`);
      }

      console.log('✅ Budget archivé avec succès');
    } catch (error) {
      console.error('❌ Erreur dans archiveBudget:', error);
      throw error;
    }
  }

  /**
   * Active ou désactive un budget
   */
  static async toggleBudgetStatus(budgetId: string, isActive: boolean): Promise<void> {
    try {
      console.log(`🔄 ${isActive ? 'Activation' : 'Désactivation'} du budget:`, budgetId);

      const { error } = await supabase
        .from('budgets')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', budgetId);

      if (error) {
        console.error('❌ Erreur lors du changement de statut du budget:', error);
        throw new Error(`Erreur lors du changement de statut du budget: ${error.message}`);
      }

      console.log(`✅ Budget ${isActive ? 'activé' : 'désactivé'} avec succès`);
    } catch (error) {
      console.error('❌ Erreur dans toggleBudgetStatus:', error);
      throw error;
    }
  }

  /**
   * Supprime définitivement un budget
   */
  static async deleteBudget(budgetId: string): Promise<void> {
    try {
      console.log('🗑️ Suppression du budget:', budgetId);

      // Vérifier s'il y a des dépenses liées
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('id')
        .eq('budget_id', budgetId)
        .limit(1);

      if (expensesError) {
        throw new Error(`Erreur lors de la vérification des dépenses: ${expensesError.message}`);
      }

      if (expenses && expenses.length > 0) {
        throw new Error('Impossible de supprimer ce budget car il contient des dépenses. Archivez-le plutôt.');
      }

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) {
        console.error('❌ Erreur lors de la suppression du budget:', error);
        throw new Error(`Erreur lors de la suppression du budget: ${error.message}`);
      }

      console.log('✅ Budget supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur dans deleteBudget:', error);
      throw error;
    }
  }

  /**
   * Obtient les alertes de budget pour une entreprise
   */
  static async getBudgetAlerts(companyId: string): Promise<BudgetAlert[]> {
    try {
      console.log('🚨 Récupération des alertes de budget pour l\'entreprise:', companyId);

      const budgets = await this.getBudgetsByCompany(companyId);
      const alerts: BudgetAlert[] = [];

      budgets.forEach(budget => {
        const { percentage_used, remaining_amount } = budget;

        // Alerte de danger si le budget est dépassé
        if (budget.is_over_budget) {
          alerts.push({
            budget_id: budget.id,
            budget_name: budget.name,
            type: 'danger',
            message: `Budget dépassé de ${Math.abs(remaining_amount).toFixed(2)}€`,
            percentage_used,
            remaining_amount
          });
        }
        // Alerte d'avertissement si plus de 80% du budget est utilisé
        else if (percentage_used >= 80) {
          alerts.push({
            budget_id: budget.id,
            budget_name: budget.name,
            type: 'warning',
            message: `${percentage_used.toFixed(1)}% du budget utilisé`,
            percentage_used,
            remaining_amount
          });
        }
      });

      console.log('✅ Alertes de budget récupérées:', alerts.length);
      return alerts;
    } catch (error) {
      console.error('❌ Erreur dans getBudgetAlerts:', error);
      throw error;
    }
  }

  /**
   * Réactive un budget archivé
   */
  static async reactivateBudget(budgetId: string): Promise<void> {
    try {
      console.log('🔄 Réactivation du budget:', budgetId);

      const { error } = await supabase
        .from('budgets')
        .update({ is_active: true })
        .eq('id', budgetId);

      if (error) {
        console.error('❌ Erreur lors de la réactivation du budget:', error);
        throw new Error(`Erreur lors de la réactivation du budget: ${error.message}`);
      }

      console.log('✅ Budget réactivé avec succès');
    } catch (error) {
      console.error('❌ Erreur dans reactivateBudget:', error);
      throw error;
    }
  }

  /**
   * Recalcule les montants dépensés de tous les budgets d'une entreprise
   * basé sur le nouveau système de badges
   */
  static async recalculateAllBudgetsSpentAmount(companyId: string): Promise<void> {
    try {
      console.log('🔄 Recalcul des montants dépensés pour tous les budgets de l\'entreprise:', companyId);

      // Import dynamique pour éviter les dépendances circulaires
      const { BadgeService } = await import('./badgeService');

      // Récupérer tous les budgets actifs de l'entreprise
      const { data: budgets, error } = await supabase
        .from('budgets')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Erreur lors de la récupération des budgets: ${error.message}`);
      }

      if (!budgets || budgets.length === 0) {
        console.log('ℹ️ Aucun budget trouvé pour cette entreprise');
        return;
      }

      // Recalculer chaque budget
      let updatedCount = 0;
      for (const budget of budgets) {
        try {
          await BadgeService.recalculateBudgetSpentAmount(budget.id);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Erreur lors du recalcul du budget ${budget.id}:`, error);
        }
      }

      console.log(`✅ Recalcul terminé: ${updatedCount}/${budgets.length} budgets mis à jour`);
    } catch (error) {
      console.error('❌ Erreur dans recalculateAllBudgetsSpentAmount:', error);
      throw error;
    }
  }
}
