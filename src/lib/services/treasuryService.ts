import { supabase } from '../supabase';
import type { BudgetWithStats } from '../../types/budget';

/**
 * Interface pour les données de trésorerie globale
 */
export interface GlobalTreasury {
  /** Montant total des budgets */
  total_budgets: number;
  /** Montant total dépensé */
  total_spent: number;
  /** Montant restant des budgets */
  remaining_budgets: number;
  /** Montant total des factures VTE */
  total_vte_invoices: number;
  /** Trésorerie globale (budgets restants + factures VTE) */
  global_treasury: number;
  /** Nombre de budgets actifs */
  active_budgets_count: number;
  /** Nombre de factures VTE */
  vte_invoices_count: number;
  /** Détails des budgets */
  budgets: BudgetWithStats[];
  /** Liste des factures VTE avec leurs montants */
  vte_invoices: Array<{
    id: string;
    name: string;
    amount: number;
    document_date: string;
  }>;
}

/**
 * Service pour gérer la trésorerie globale
 */
export class TreasuryService {
  /**
   * Calcule la trésorerie globale d'une entreprise
   * - Additionne tous les budgets existants (montants restants)
   * - Additionne toutes les factures avec le préfixe VTE
   */
  static async getGlobalTreasury(companyId: string): Promise<GlobalTreasury> {
    try {
      console.log('💰 Calcul de la trésorerie globale pour l\'entreprise:', companyId);

      // 1. Récupérer tous les budgets actifs avec leurs statistiques
      const { data: budgets, error: budgetsError } = await supabase
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
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (budgetsError) {
        console.error('❌ Erreur lors de la récupération des budgets:', budgetsError);
        throw new Error(`Erreur lors de la récupération des budgets: ${budgetsError.message}`);
      }

      // 2. Récupérer toutes les factures avec préfixe VTE (fichiers dont le nom commence par "Vte_" ou "VTE_")
      const { data: vteFiles, error: vteError } = await supabase
        .from('files')
        .select('id, name, amount, document_date')
        .eq('company_id', companyId)
        .or('name.ilike.vte_%,name.ilike.Vte_%,name.ilike.VTE_%')
        .not('amount', 'is', null)
        .order('document_date', { ascending: false });

      if (vteError) {
        console.error('❌ Erreur lors de la récupération des factures VTE:', vteError);
        throw new Error(`Erreur lors de la récupération des factures VTE: ${vteError.message}`);
      }

      // 3. Calculer les statistiques des budgets
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

      // 4. Filtrer et calculer les totaux des budgets ACTIFS uniquement
      const activeBudgets = budgetsWithStats.filter(budget => budget.is_active);
      const totalBudgets = activeBudgets.reduce((sum, budget) => sum + budget.initial_amount, 0);
      const totalSpent = activeBudgets.reduce((sum, budget) => sum + budget.spent_amount, 0);
      const remainingBudgets = totalBudgets - totalSpent;

      // 5. Calculer le total des factures VTE
      const vteInvoices = vteFiles?.map(file => ({
        id: file.id,
        name: file.name,
        amount: file.amount || 0,
        document_date: file.document_date
      })) || [];

      const totalVteInvoices = vteInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

      // 6. Calculer la trésorerie globale
      const globalTreasury = remainingBudgets + totalVteInvoices;

      const result: GlobalTreasury = {
        total_budgets: totalBudgets,
        total_spent: totalSpent,
        remaining_budgets: remainingBudgets,
        total_vte_invoices: totalVteInvoices,
        global_treasury: globalTreasury,
        active_budgets_count: activeBudgets.length,
        vte_invoices_count: vteInvoices.length,
        budgets: budgetsWithStats,
        vte_invoices: vteInvoices
      };

      console.log('✅ Trésorerie globale calculée:', {
        totalBudgets: result.total_budgets,
        remainingBudgets: result.remaining_budgets,
        totalVteInvoices: result.total_vte_invoices,
        globalTreasury: result.global_treasury
      });

      return result;
    } catch (error) {
      console.error('❌ Erreur dans getGlobalTreasury:', error);
      throw error;
    }
  }

  /**
   * Récupère uniquement les factures VTE d'une entreprise
   */
  static async getVteInvoices(companyId: string): Promise<Array<{
    id: string;
    name: string;
    amount: number;
    document_date: string;
    url?: string;
  }>> {
    try {
      console.log('📄 Récupération des factures VTE pour l\'entreprise:', companyId);

      const { data: vteFiles, error } = await supabase
        .from('files')
        .select('id, name, amount, document_date, url')
        .eq('company_id', companyId)
        .or('name.ilike.vte_%,name.ilike.Vte_%,name.ilike.VTE_%')
        .not('amount', 'is', null)
        .order('document_date', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des factures VTE:', error);
        throw new Error(`Erreur lors de la récupération des factures VTE: ${error.message}`);
      }

      const vteInvoices = vteFiles?.map(file => ({
        id: file.id,
        name: file.name,
        amount: file.amount || 0,
        document_date: file.document_date,
        url: file.url
      })) || [];

      console.log('✅ Factures VTE récupérées:', vteInvoices.length);
      return vteInvoices;
    } catch (error) {
      console.error('❌ Erreur dans getVteInvoices:', error);
      throw error;
    }
  }

  /**
   * Récupère un résumé rapide de la trésorerie
   */
  static async getTreasurySummary(companyId: string): Promise<{
    remaining_budgets: number;
    total_vte_invoices: number;
    global_treasury: number;
  }> {
    try {
      console.log('📊 Récupération du résumé de trésorerie pour l\'entreprise:', companyId);

      // Récupérer la somme des budgets restants (budgets actifs uniquement)
      const { data: budgetsSummary, error: budgetsError } = await supabase
        .from('budgets')
        .select('initial_amount, spent_amount')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (budgetsError) {
        throw new Error(`Erreur lors de la récupération des budgets: ${budgetsError.message}`);
      }

      // Récupérer la somme des factures VTE
      const { data: vteSum, error: vteError } = await supabase
        .from('files')
        .select('amount')
        .eq('company_id', companyId)
        .or('name.ilike.vte_%,name.ilike.Vte_%,name.ilike.VTE_%')
        .not('amount', 'is', null);

      if (vteError) {
        throw new Error(`Erreur lors de la récupération des factures VTE: ${vteError.message}`);
      }

      const remainingBudgets = budgetsSummary?.reduce((sum, budget) => 
        sum + (budget.initial_amount - budget.spent_amount), 0) || 0;
      
      const totalVteInvoices = vteSum?.reduce((sum, file) => sum + (file.amount || 0), 0) || 0;
      
      const globalTreasury = remainingBudgets + totalVteInvoices;

      console.log('✅ Résumé de trésorerie calculé:', {
        remainingBudgets,
        totalVteInvoices,
        globalTreasury
      });

      return {
        remaining_budgets: remainingBudgets,
        total_vte_invoices: totalVteInvoices,
        global_treasury: globalTreasury
      };
    } catch (error) {
      console.error('❌ Erreur dans getTreasurySummary:', error);
      throw error;
    }
  }
}
