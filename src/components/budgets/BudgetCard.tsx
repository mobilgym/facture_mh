import React from 'react';
import { Edit, Archive, Trash2, AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import type { BudgetWithStats } from '../../types/budget';

interface BudgetCardProps {
  budget: BudgetWithStats;
  onEdit: (budget: BudgetWithStats) => void;
  onArchive: (budgetId: string) => void;
  onDelete: (budgetId: string) => void;
  onToggleStatus: (budgetId: string, isActive: boolean) => void;
  onRecalculate?: (budgetId: string) => void;
  onClick?: (budget: BudgetWithStats) => void;
  isRecalculating?: boolean;
}

export function BudgetCard({ budget, onEdit, onArchive, onDelete, onToggleStatus, onRecalculate, onClick, isRecalculating = false }: BudgetCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(budget);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(budget);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(budget.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(budget.id);
  };

  const handleToggleStatus = (isActive: boolean) => {
    onToggleStatus(budget.id, isActive);
  };

  const handleRecalculate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRecalculate) {
      onRecalculate(budget.id);
    }
  };

  const getProgressColor = () => {
    if (budget.is_over_budget) return 'bg-red-500';
    if (budget.percentage_used >= 80) return 'bg-yellow-500';
    if (budget.percentage_used >= 60) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getProgressBgColor = () => {
    if (budget.is_over_budget) return 'bg-red-100';
    if (budget.percentage_used >= 80) return 'bg-yellow-100';
    return 'bg-gray-200';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div 
      className={`budget-container bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer relative ${
        budget.is_over_budget ? 'border-red-300' : 'border-gray-200'
      } ${!budget.is_active ? 'opacity-75 bg-gray-50' : ''}`}
      onClick={handleCardClick}
    >
      {/* Toggle switch en haut à droite */}
      <div className="absolute top-3 right-3 z-10">
        <ToggleSwitch
          enabled={budget.is_active}
          onChange={handleToggleStatus}
          size="sm"
          className="shadow-sm"
        />
      </div>

      <div className="p-4 sm:p-6 pr-12 sm:pr-16">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <h3 className={`text-fit-md font-semibold truncate ${budget.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                {budget.name}
              </h3>
              {!budget.is_active && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-200 text-gray-600 rounded-full shrink-0">
                  Désactivé
                </span>
              )}
            </div>
            {budget.description && (
              <p className={`text-fit-xs line-clamp-2 ${budget.is_active ? 'text-gray-600' : 'text-gray-500'}`}>
                {budget.description}
              </p>
            )}
          </div>
          
          {/* Alertes (seulement si actif) */}
          {budget.is_active && budget.is_over_budget && (
            <div className="flex items-center text-red-600 ml-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          {budget.is_active && budget.percentage_used >= 80 && !budget.is_over_budget && (
            <div className="flex items-center text-yellow-600 ml-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Montants */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-fit-xs font-medium text-gray-500 uppercase tracking-wide truncate">
              Budget Initial
            </p>
            <p className="text-fit-lg font-semibold text-gray-900 truncate tabular-nums">
              {formatAmount(budget.initial_amount)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-fit-xs font-medium text-gray-500 uppercase tracking-wide truncate">
              Restant
            </p>
            <div className="flex items-center min-w-0">
              <p className={`text-fit-lg font-semibold truncate tabular-nums ${
                budget.remaining_amount < 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatAmount(budget.remaining_amount)}
              </p>
              {budget.remaining_amount < 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-red-600 ml-1 shrink-0" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-green-600 ml-1 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-fit-xs font-medium text-gray-700">
              Utilisation
            </span>
            <span className={`text-fit-xs font-semibold tabular-nums ${
              budget.is_over_budget ? 'text-red-600' : 'text-gray-900'
            }`}>
              {budget.percentage_used.toFixed(1)}%
            </span>
          </div>
          <div className={`w-full ${getProgressBgColor()} rounded-full h-2`}>
            <div 
              className={`${getProgressColor()} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
            />
          </div>
        </div>

        {/* Dépensé */}
        <div className="mb-3">
          <p className="text-fit-xs font-medium text-gray-500 uppercase tracking-wide mb-1 truncate">
            Dépensé
          </p>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-fit-md font-semibold text-gray-900 truncate tabular-nums">
              {formatAmount(budget.spent_amount)}
            </p>
            <span className="text-fit-xs text-gray-600 truncate">
              {budget.expenses_count} dépense{budget.expenses_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Période */}
        {(budget.start_date || budget.end_date) && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-fit-xs font-medium text-gray-500 uppercase tracking-wide mb-1 truncate">
              Période
            </p>
            <p className="text-fit-sm text-gray-700 truncate">
              {budget.start_date ? formatDate(budget.start_date) : '—'} 
              {' → '}
              {budget.end_date ? formatDate(budget.end_date) : '—'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100">
          {onRecalculate && (
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="inline-flex items-center whitespace-nowrap px-2.5 py-1 border border-green-300 shadow-sm text-fit-xs font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
              title="Recalculer les montants basés sur les badges"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Calcul...' : 'Recalculer'}
            </button>
          )}

          <button
            onClick={handleEdit}
            className="inline-flex items-center whitespace-nowrap px-2.5 py-1 border border-gray-300 shadow-sm text-fit-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            Modifier
          </button>

          <button
            onClick={handleArchive}
            className="inline-flex items-center whitespace-nowrap px-2.5 py-1 border border-gray-300 shadow-sm text-fit-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            <Archive className="h-3.5 w-3.5 mr-1" />
            Archiver
          </button>

          <button
            onClick={handleDelete}
            className="inline-flex items-center whitespace-nowrap px-2.5 py-1 border border-red-300 shadow-sm text-fit-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
