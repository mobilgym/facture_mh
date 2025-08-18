import React from 'react';
import { Edit, Archive, Trash2, TrendingUp } from 'lucide-react';
import type { ExpenseCategoryWithStats } from '../../types/budget';

interface ExpenseCategoryCardProps {
  category: ExpenseCategoryWithStats;
  onEdit: (category: ExpenseCategoryWithStats) => void;
  onArchive: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
  onClick?: (category: ExpenseCategoryWithStats) => void;
}

export function ExpenseCategoryCard({ 
  category, 
  onEdit, 
  onArchive, 
  onDelete, 
  onClick 
}: ExpenseCategoryCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(category);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(category);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(category.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(category.id);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* En-tête avec couleur */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Total dépensé
            </p>
            <div className="flex items-center">
              <p className="text-lg font-semibold text-gray-900">
                {formatAmount(category.total_amount)}
              </p>
              <TrendingUp className="h-4 w-4 text-green-600 ml-1" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Nombre de dépenses
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {category.expenses_count}
            </p>
          </div>
        </div>

        {/* Pourcentage du total */}
        {category.percentage_of_total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Part du total
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {category.percentage_of_total.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(category.percentage_of_total, 100)}%`,
                  backgroundColor: category.color 
                }}
              />
            </div>
          </div>
        )}

        {/* Moyenne par dépense */}
        {category.expenses_count > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Moyenne par dépense
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formatAmount(category.total_amount / category.expenses_count)}
            </p>
          </div>
        )}

        {/* Badge de statut */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            category.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {category.is_active ? 'Actif' : 'Archivé'}
          </span>
        </div>

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
