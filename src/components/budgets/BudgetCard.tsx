import React from 'react';
import { Edit, Archive, Trash2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import type { BudgetWithStats } from '../../types/budget';

interface BudgetCardProps {
  budget: BudgetWithStats;
  onEdit: (budget: BudgetWithStats) => void;
  onArchive: (budgetId: string) => void;
  onDelete: (budgetId: string) => void;
  onToggleStatus: (budgetId: string, isActive: boolean) => void;
  onClick?: (budget: BudgetWithStats) => void;
}

export function BudgetCard({ budget, onEdit, onArchive, onDelete, onToggleStatus, onClick }: BudgetCardProps) {
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
      className={`bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow cursor-pointer relative ${
        budget.is_over_budget ? 'border-red-300' : 'border-gray-200'
      } ${!budget.is_active ? 'opacity-75 bg-gray-50' : ''}`}
      onClick={handleCardClick}
    >
      {/* Toggle switch en haut à droite */}
      <div className="absolute top-4 right-4 z-10">
        <ToggleSwitch
          enabled={budget.is_active}
          onChange={handleToggleStatus}
          size="sm"
          className="shadow-sm"
        />
      </div>

      <div className="p-6 pr-16">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-lg font-semibold ${budget.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                {budget.name}
              </h3>
              {!budget.is_active && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                  Désactivé
                </span>
              )}
            </div>
            {budget.description && (
              <p className={`text-sm line-clamp-2 ${budget.is_active ? 'text-gray-600' : 'text-gray-500'}`}>
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
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Budget Initial
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatAmount(budget.initial_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Restant
            </p>
            <div className="flex items-center">
              <p className={`text-lg font-semibold ${
                budget.remaining_amount < 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatAmount(budget.remaining_amount)}
              </p>
              {budget.remaining_amount < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-600 ml-1" />
              ) : (
                <TrendingUp className="h-4 w-4 text-green-600 ml-1" />
              )}
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Utilisation
            </span>
            <span className={`text-sm font-semibold ${
              budget.is_over_budget ? 'text-red-600' : 'text-gray-900'
            }`}>
              {budget.percentage_used.toFixed(1)}%
            </span>
          </div>
          <div className={`w-full ${getProgressBgColor()} rounded-full h-2.5`}>
            <div 
              className={`${getProgressColor()} h-2.5 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
            />
          </div>
        </div>

        {/* Dépensé */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Dépensé
          </p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-900">
              {formatAmount(budget.spent_amount)}
            </p>
            <span className="text-sm text-gray-600">
              {budget.expenses_count} dépense{budget.expenses_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Période */}
        {(budget.start_date || budget.end_date) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Période
            </p>
            <p className="text-sm text-gray-700">
              {budget.start_date ? formatDate(budget.start_date) : '—'} 
              {' → '}
              {budget.end_date ? formatDate(budget.end_date) : '—'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Edit className="h-4 w-4 mr-1" />
            Modifier
          </button>
          
          <button
            onClick={handleArchive}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            <Archive className="h-4 w-4 mr-1" />
            Archiver
          </button>
          
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
