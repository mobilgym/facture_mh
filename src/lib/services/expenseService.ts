import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';
import type { 
  Expense, 
  ExpenseWithDetails, 
  CreateExpenseForm, 
  ExpenseAnalysis,
  PaymentMethod,
  ExpenseStatus 
} from '../../types/budget';

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

/**
 * Service pour gérer les dépenses
 */
export class ExpenseService {
  /**
   * Récupère toutes les dépenses d'une entreprise avec leurs détails
   */
  static async getExpensesByCompany(companyId: string): Promise<ExpenseWithDetails[]> {
    try {
      console.log('🔍 Récupération des dépenses pour l\'entreprise:', companyId);

      const { data: expenses, error } = await supabase
        .from('expenses')
        .select(`
          *,
          budget:budgets(id, name),
          expense_category:expense_categories(id, name, color),
          file:files(id, name, url)
        `)
        .eq('company_id', companyId)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des dépenses:', error);
        throw new Error(`Erreur lors de la récupération des dépenses: ${error.message}`);
      }

      console.log('✅ Dépenses récupérées avec succès:', expenses?.length || 0);
      return expenses || [];
    } catch (error) {
      console.error('❌ Erreur dans getExpensesByCompany:', error);
      throw error;
    }
  }

  /**
   * Récupère les dépenses d'un budget spécifique
   */
  static async getExpensesByBudget(budgetId: string): Promise<ExpenseWithDetails[]> {
    try {
      console.log('🔍 Récupération des dépenses pour le budget:', budgetId);

      const { data: expenses, error } = await supabase
        .from('expenses')
        .select(`
          *,
          budget:budgets(id, name),
          expense_category:expense_categories(id, name, color),
          file:files(id, name, url)
        `)
        .eq('budget_id', budgetId)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des dépenses du budget:', error);
        throw new Error(`Erreur lors de la récupération des dépenses: ${error.message}`);
      }

      console.log('✅ Dépenses du budget récupérées avec succès:', expenses?.length || 0);
      return expenses || [];
    } catch (error) {
      console.error('❌ Erreur dans getExpensesByBudget:', error);
      throw error;
    }
  }

  /**
   * Récupère les dépenses d'un poste de dépense spécifique
   */
  static async getExpensesByCategory(categoryId: string): Promise<ExpenseWithDetails[]> {
    try {
      console.log('🔍 Récupération des dépenses pour le poste:', categoryId);

      const { data: expenses, error } = await supabase
        .from('expenses')
        .select(`
          *,
          budget:budgets(id, name),
          expense_category:expense_categories(id, name, color),
          file:files(id, name, url)
        `)
        .eq('expense_category_id', categoryId)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des dépenses du poste:', error);
        throw new Error(`Erreur lors de la récupération des dépenses: ${error.message}`);
      }

      console.log('✅ Dépenses du poste récupérées avec succès:', expenses?.length || 0);
      return expenses || [];
    } catch (error) {
      console.error('❌ Erreur dans getExpensesByCategory:', error);
      throw error;
    }
  }

  /**
   * Récupère une dépense par ID
   */
  static async getExpenseById(expenseId: string): Promise<ExpenseWithDetails | null> {
    try {
      console.log('🔍 Récupération de la dépense:', expenseId);

      const { data: expense, error } = await supabase
        .from('expenses')
        .select(`
          *,
          budget:budgets(id, name),
          expense_category:expense_categories(id, name, color),
          file:files(id, name, url)
        `)
        .eq('id', expenseId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('❌ Erreur lors de la récupération de la dépense:', error);
        throw new Error(`Erreur lors de la récupération de la dépense: ${error.message}`);
      }

      console.log('✅ Dépense récupérée avec succès');
      return expense;
    } catch (error) {
      console.error('❌ Erreur dans getExpenseById:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle dépense
   */
  static async createExpense(
    companyId: string, 
    userId: string, 
    expenseData: CreateExpenseForm,
    fileId?: string
  ): Promise<Expense> {
    try {
      console.log('📝 Création d\'une nouvelle dépense:', expenseData);

      const expenseInsert: ExpenseInsert = {
        company_id: companyId,
        created_by: userId,
        title: expenseData.title,
        description: expenseData.description || null,
        amount: expenseData.amount,
        expense_date: expenseData.expense_date,
        budget_id: expenseData.budget_id || null,
        expense_category_id: expenseData.expense_category_id || null,
        file_id: fileId || null,
        vendor: expenseData.vendor || null,
        reference_number: expenseData.reference_number || null,
        payment_method: expenseData.payment_method || null,
        is_recurring: expenseData.is_recurring || false,
        tags: expenseData.tags || null,
        status: 'pending'
      };

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert(expenseInsert)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de la dépense:', error);
        throw new Error(`Erreur lors de la création de la dépense: ${error.message}`);
      }

      console.log('✅ Dépense créée avec succès:', expense.id);
      return expense;
    } catch (error) {
      console.error('❌ Erreur dans createExpense:', error);
      throw error;
    }
  }

  /**
   * Met à jour une dépense
   */
  static async updateExpense(
    expenseId: string, 
    updates: Partial<CreateExpenseForm & { status: ExpenseStatus }>
  ): Promise<Expense> {
    try {
      console.log('📝 Mise à jour de la dépense:', expenseId, updates);

      const expenseUpdate: ExpenseUpdate = {
        title: updates.title,
        description: updates.description !== undefined ? updates.description : undefined,
        amount: updates.amount,
        expense_date: updates.expense_date,
        budget_id: updates.budget_id !== undefined ? updates.budget_id : undefined,
        expense_category_id: updates.expense_category_id !== undefined ? updates.expense_category_id : undefined,
        vendor: updates.vendor !== undefined ? updates.vendor : undefined,
        reference_number: updates.reference_number !== undefined ? updates.reference_number : undefined,
        payment_method: updates.payment_method !== undefined ? updates.payment_method : undefined,
        is_recurring: updates.is_recurring,
        tags: updates.tags !== undefined ? updates.tags : undefined,
        status: updates.status
      };

      const { data: expense, error } = await supabase
        .from('expenses')
        .update(expenseUpdate)
        .eq('id', expenseId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la dépense:', error);
        throw new Error(`Erreur lors de la mise à jour de la dépense: ${error.message}`);
      }

      console.log('✅ Dépense mise à jour avec succès');
      return expense;
    } catch (error) {
      console.error('❌ Erreur dans updateExpense:', error);
      throw error;
    }
  }

  /**
   * Supprime une dépense
   */
  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      console.log('🗑️ Suppression de la dépense:', expenseId);

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('❌ Erreur lors de la suppression de la dépense:', error);
        throw new Error(`Erreur lors de la suppression de la dépense: ${error.message}`);
      }

      console.log('✅ Dépense supprimée avec succès');
    } catch (error) {
      console.error('❌ Erreur dans deleteExpense:', error);
      throw error;
    }
  }

  /**
   * Approuve une dépense
   */
  static async approveExpense(expenseId: string): Promise<void> {
    try {
      console.log('✅ Approbation de la dépense:', expenseId);

      const { error } = await supabase
        .from('expenses')
        .update({ status: 'approved' })
        .eq('id', expenseId);

      if (error) {
        console.error('❌ Erreur lors de l\'approbation de la dépense:', error);
        throw new Error(`Erreur lors de l'approbation de la dépense: ${error.message}`);
      }

      console.log('✅ Dépense approuvée avec succès');
    } catch (error) {
      console.error('❌ Erreur dans approveExpense:', error);
      throw error;
    }
  }

  /**
   * Marque une dépense comme payée
   */
  static async markAsPaid(expenseId: string): Promise<void> {
    try {
      console.log('💰 Marquage de la dépense comme payée:', expenseId);

      const { error } = await supabase
        .from('expenses')
        .update({ status: 'paid' })
        .eq('id', expenseId);

      if (error) {
        console.error('❌ Erreur lors du marquage comme payée:', error);
        throw new Error(`Erreur lors du marquage comme payée: ${error.message}`);
      }

      console.log('✅ Dépense marquée comme payée avec succès');
    } catch (error) {
      console.error('❌ Erreur dans markAsPaid:', error);
      throw error;
    }
  }

  /**
   * Lie un fichier à une dépense existante
   */
  static async attachFileToExpense(expenseId: string, fileId: string): Promise<void> {
    try {
      console.log('📎 Liaison du fichier à la dépense:', { expenseId, fileId });

      const { error } = await supabase
        .from('expenses')
        .update({ file_id: fileId })
        .eq('id', expenseId);

      if (error) {
        console.error('❌ Erreur lors de la liaison du fichier:', error);
        throw new Error(`Erreur lors de la liaison du fichier: ${error.message}`);
      }

      // Mettre à jour le fichier avec l'ID de la dépense
      await supabase
        .from('files')
        .update({ expense_id: expenseId })
        .eq('id', fileId);

      console.log('✅ Fichier lié à la dépense avec succès');
    } catch (error) {
      console.error('❌ Erreur dans attachFileToExpense:', error);
      throw error;
    }
  }

  /**
   * Détache un fichier d'une dépense
   */
  static async detachFileFromExpense(expenseId: string): Promise<void> {
    try {
      console.log('📎 Détachement du fichier de la dépense:', expenseId);

      // Récupérer l'ID du fichier d'abord
      const { data: expense } = await supabase
        .from('expenses')
        .select('file_id')
        .eq('id', expenseId)
        .single();

      if (expense?.file_id) {
        // Retirer la liaison dans la table des fichiers
        await supabase
          .from('files')
          .update({ expense_id: null })
          .eq('id', expense.file_id);
      }

      // Retirer la liaison dans la table des dépenses
      const { error } = await supabase
        .from('expenses')
        .update({ file_id: null })
        .eq('id', expenseId);

      if (error) {
        console.error('❌ Erreur lors du détachement du fichier:', error);
        throw new Error(`Erreur lors du détachement du fichier: ${error.message}`);
      }

      console.log('✅ Fichier détaché de la dépense avec succès');
    } catch (error) {
      console.error('❌ Erreur dans detachFileFromExpense:', error);
      throw error;
    }
  }

  /**
   * Génère une analyse des dépenses pour une entreprise
   */
  static async getExpenseAnalysis(companyId: string, startDate?: string, endDate?: string): Promise<ExpenseAnalysis> {
    try {
      console.log('📊 Génération de l\'analyse des dépenses pour l\'entreprise:', companyId);

      let query = supabase
        .from('expenses')
        .select(`
          *,
          budget:budgets(id, name),
          expense_category:expense_categories(id, name, color)
        `)
        .eq('company_id', companyId)
        .in('status', ['approved', 'paid']);

      if (startDate) {
        query = query.gte('expense_date', startDate);
      }
      if (endDate) {
        query = query.lte('expense_date', endDate);
      }

      const { data: expenses, error } = await query;

      if (error) {
        console.error('❌ Erreur lors de la récupération des données d\'analyse:', error);
        throw new Error(`Erreur lors de l'analyse: ${error.message}`);
      }

      const expensesData = expenses || [];

      // Calculs généraux
      const totalAmount = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
      const expensesCount = expensesData.length;
      const averageExpense = expensesCount > 0 ? totalAmount / expensesCount : 0;

      // Analyse par catégorie
      const categoryMap = new Map();
      expensesData.forEach(expense => {
        if (expense.expense_category) {
          const categoryId = expense.expense_category.id;
          if (!categoryMap.has(categoryId)) {
            categoryMap.set(categoryId, {
              ...expense.expense_category,
              total_amount: 0,
              expenses_count: 0,
              percentage_of_total: 0
            });
          }
          const category = categoryMap.get(categoryId);
          category.total_amount += expense.amount;
          category.expenses_count += 1;
        }
      });

      const byCategory = Array.from(categoryMap.values()).map(category => ({
        ...category,
        percentage_of_total: totalAmount > 0 ? (category.total_amount / totalAmount) * 100 : 0
      }));

      // Analyse par budget
      const budgetMap = new Map();
      expensesData.forEach(expense => {
        if (expense.budget) {
          const budgetId = expense.budget.id;
          if (!budgetMap.has(budgetId)) {
            budgetMap.set(budgetId, {
              ...expense.budget,
              total_amount: 0,
              expenses_count: 0,
              percentage_used: 0,
              is_over_budget: false
            });
          }
          const budget = budgetMap.get(budgetId);
          budget.total_amount += expense.amount;
          budget.expenses_count += 1;
        }
      });

      const byBudget = Array.from(budgetMap.values());

      // Analyse par mois
      const monthMap = new Map();
      expensesData.forEach(expense => {
        const date = new Date(expense.expense_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { month: monthKey, amount: 0, count: 0 });
        }
        const month = monthMap.get(monthKey);
        month.amount += expense.amount;
        month.count += 1;
      });

      const byMonth = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

      // Analyse par méthode de paiement
      const paymentMethodMap = new Map();
      expensesData.forEach(expense => {
        const method = expense.payment_method || 'other';
        if (!paymentMethodMap.has(method)) {
          paymentMethodMap.set(method, { method: method as PaymentMethod, amount: 0, count: 0 });
        }
        const methodData = paymentMethodMap.get(method);
        methodData.amount += expense.amount;
        methodData.count += 1;
      });

      const byPaymentMethod = Array.from(paymentMethodMap.values());

      const analysis: ExpenseAnalysis = {
        total_amount: totalAmount,
        expenses_count: expensesCount,
        average_expense: averageExpense,
        by_category: byCategory,
        by_budget: byBudget,
        by_month: byMonth,
        by_payment_method: byPaymentMethod
      };

      console.log('✅ Analyse des dépenses générée avec succès');
      return analysis;
    } catch (error) {
      console.error('❌ Erreur dans getExpenseAnalysis:', error);
      throw error;
    }
  }
}
