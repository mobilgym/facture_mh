export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'card' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export interface ExpenseCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Budget {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  initial_amount: number;
  spent_amount: number;
  remaining_amount: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Expense {
  id: string;
  company_id: string;
  budget_id?: string;
  expense_category_id?: string;
  file_id?: string;
  title: string;
  description?: string;
  amount: number;
  expense_date: string;
  vendor?: string;
  reference_number?: string;
  payment_method?: PaymentMethod;
  is_recurring: boolean;
  tags?: string[];
  status: ExpenseStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Types avec relations pour l'affichage
export interface ExpenseWithDetails extends Expense {
  budget?: Budget;
  expense_category?: ExpenseCategory;
  file?: {
    id: string;
    name: string;
    url: string;
  };
}

export interface BudgetWithStats extends Budget {
  expenses_count: number;
  percentage_used: number;
  is_over_budget: boolean;
}

export interface ExpenseCategoryWithStats extends ExpenseCategory {
  total_amount: number;
  expenses_count: number;
  percentage_of_total: number;
}

// Types pour les formulaires
export interface CreateBudgetForm {
  name: string;
  description?: string;
  initial_amount: number;
  start_date?: string;
  end_date?: string;
}

export interface CreateExpenseCategoryForm {
  name: string;
  description?: string;
  color: string;
}

export interface CreateExpenseForm {
  title: string;
  description?: string;
  amount: number;
  expense_date: string;
  budget_id?: string;
  expense_category_id?: string;
  vendor?: string;
  reference_number?: string;
  payment_method?: PaymentMethod;
  is_recurring: boolean;
  tags?: string[];
  file?: File;
}

// Types pour l'analyse
export interface ExpenseAnalysis {
  total_amount: number;
  expenses_count: number;
  average_expense: number;
  by_category: ExpenseCategoryWithStats[];
  by_budget: BudgetWithStats[];
  by_month: {
    month: string;
    amount: number;
    count: number;
  }[];
  by_payment_method: {
    method: PaymentMethod;
    amount: number;
    count: number;
  }[];
}

export interface BudgetAlert {
  budget_id: string;
  budget_name: string;
  type: 'warning' | 'danger';
  message: string;
  percentage_used: number;
  remaining_amount: number;
}
