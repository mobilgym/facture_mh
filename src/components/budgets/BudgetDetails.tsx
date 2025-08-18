import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Tag, TrendingUp } from 'lucide-react';
import type { BudgetWithStats, ExpenseCategory } from '../../types/budget';
import { useBudgetExpenseCategories } from '../../hooks/useBudgetExpenseCategories';
import { useExpenses } from '../../hooks/useExpenses';

interface BudgetDetailsProps {
  budget: BudgetWithStats;
  onClose: () => void;
}

export function BudgetDetails({ budget, onClose }: BudgetDetailsProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { categories } = useBudgetExpenseCategories(budget.id);
  const { expenses, loading } = useExpenses({ budgetId: budget.id });

  console.log('🔍 BudgetDetails - Budget ID:', budget.id);
  console.log('📊 BudgetDetails - Dépenses chargées:', expenses.length);
  console.log('📋 BudgetDetails - Catégories chargées:', categories.length);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Grouper les dépenses par catégorie
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const categoryId = expense.expense_category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = {
        expenses: [],
        totalAmount: 0
      };
    }
    acc[categoryId].expenses.push(expense);
    acc[categoryId].totalAmount += expense.amount;
    return acc;
  }, {} as Record<string, { expenses: typeof expenses, totalAmount: number }>);

  console.log('📊 BudgetDetails - Dépenses groupées par catégorie:', expensesByCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {budget.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Résumé du budget */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-700">Budget Initial</p>
              <p className="text-2xl font-bold text-green-900">{formatAmount(budget.initial_amount)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-700">Dépensé</p>
              <p className="text-2xl font-bold text-blue-900">{formatAmount(budget.spent_amount)}</p>
            </div>
            <div className="bg-cyan-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-cyan-700">Restant</p>
              <p className="text-2xl font-bold text-cyan-900">{formatAmount(budget.remaining_amount)}</p>
            </div>
          </div>

          {/* Liste des postes de dépenses */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Postes de Dépenses
            </h3>

            {loading ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des dépenses...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Aucun poste de dépense n'est associé à ce budget.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => {
                  const isExpanded = expandedCategories.has(category.id);
                  const categoryData = expensesByCategory[category.id] || { expenses: [], totalAmount: 0 };
                  const percentage = budget.initial_amount > 0 
                    ? (categoryData.totalAmount / budget.initial_amount) * 100 
                    : 0;

                  return (
                    <div 
                      key={category.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* En-tête de la catégorie */}
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium text-gray-900">
                              {category.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatAmount(categoryData.totalAmount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {percentage.toFixed(1)}% du budget
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 text-xs">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {categoryData.expenses.length} dépense{categoryData.expenses.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Liste des dépenses */}
                      {isExpanded && categoryData.expenses.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          <div className="divide-y divide-gray-200">
                            {categoryData.expenses.map((expense) => (
                              <div 
                                key={expense.id}
                                className="p-4 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {expense.title}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatDate(expense.expense_date)}
                                    </p>
                                  </div>
                                  <p className="font-medium text-gray-900">
                                    {formatAmount(expense.amount)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
