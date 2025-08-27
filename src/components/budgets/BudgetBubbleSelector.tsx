import React from 'react';
import { BubblePicker } from '../ui/BubblePicker';
import type { BudgetWithStats } from '../../types/budget';

interface BudgetBubbleSelectorProps {
  budgets: BudgetWithStats[];
  selectedBudget: BudgetWithStats | null;
  onBudgetSelect: (budget: BudgetWithStats) => void;
  onBudgetRemove: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

// Générateur de couleurs pour les budgets
const generateBudgetColor = (budget: BudgetWithStats): string => {
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#F97316', // orange-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
  ];

  // Utiliser l'ID du budget pour générer une couleur consistante
  const hash = budget.id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

export function BudgetBubbleSelector({
  budgets,
  selectedBudget,
  onBudgetSelect,
  onBudgetRemove,
  loading = false,
  disabled = false,
  className = ''
}: BudgetBubbleSelectorProps) {
  // Filtrer les budgets actifs
  const activeBudgets = budgets.filter(budget => budget.is_active);

  // Transformer les budgets en format BubbleItem
  const budgetItems = activeBudgets.map(budget => {
    const remaining = budget.initial_amount - budget.spent_amount;
    const percentage = budget.initial_amount > 0 
      ? (budget.spent_amount / budget.initial_amount) * 100 
      : 0;

    return {
      id: budget.id,
      name: budget.name,
      color: generateBudgetColor(budget),
      description: budget.description || undefined,
      subtitle: `${remaining.toFixed(2)}€ disponible • ${percentage.toFixed(1)}% utilisé`,
      disabled: budget.is_over_budget
    };
  });

  const selectedItems = selectedBudget ? [budgetItems.find(item => item.id === selectedBudget.id)].filter(Boolean) : [];

  const handleItemSelect = (item: any) => {
    const budget = budgets.find(b => b.id === item.id);
    if (budget) {
      onBudgetSelect(budget);
    }
  };

  const handleItemRemove = () => {
    onBudgetRemove();
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Budget
        </label>
        <div className="w-full flex items-center justify-center px-4 py-6 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Chargement des budgets...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BubblePicker
      items={budgetItems}
      selectedItems={selectedItems as any}
      onItemSelect={handleItemSelect}
      onItemRemove={handleItemRemove}
      placeholder="Cliquer pour sélectionner un budget"
      label="Budget"
      disabled={disabled}
      allowMultiple={false}
      searchable={true}
      emptyMessage="Aucun budget actif disponible"
      className={className}
    />
  );
}
