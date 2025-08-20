import React from 'react';
import { Edit2, Archive, Trash2, FileText, TrendingUp, RotateCcw } from 'lucide-react';
import { Badge } from './Badge';
import type { BadgeWithStats } from '../../types/badge';

interface BadgeCardProps {
  badge: BadgeWithStats;
  onEdit?: (badge: BadgeWithStats) => void;
  onArchive?: (badge: BadgeWithStats) => void;
  onDelete?: (badge: BadgeWithStats) => void;
  onReactivate?: (badge: BadgeWithStats) => void;
  onClick?: (badge: BadgeWithStats) => void;
}

export function BadgeCard({ badge, onEdit, onArchive, onDelete, onReactivate, onClick }: BadgeCardProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200 p-6 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-md' : ''}
      `}
      onClick={() => onClick?.(badge)}
    >
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Badge badge={badge} variant="default" />
          {badge.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {badge.description}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-1 ml-4">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(badge);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {badge.is_active ? (
            // Boutons pour badges actifs
            <>
              {onArchive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(badge);
                  }}
                  className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  title="Archiver"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(badge);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            // Boutons pour badges archivés
            <>
              {onReactivate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReactivate(badge);
                  }}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Réactiver"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(badge);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer définitivement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="space-y-3">
        {/* Montant total */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Montant total
          </div>
          <span className="text-lg font-semibold text-gray-900">
            {formatAmount(badge.total_amount)}
          </span>
        </div>

        {/* Nombre de fichiers */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="w-4 h-4 mr-2" />
            Factures
          </div>
          <span className="text-sm font-medium text-gray-700">
            {badge.files_count} fichier{badge.files_count > 1 ? 's' : ''}
          </span>
        </div>

        {/* Pourcentage du total */}
        {badge.percentage_of_total > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Part du total</span>
              <span className="font-medium text-gray-900">
                {badge.percentage_of_total}%
              </span>
            </div>
            {/* Barre de progression */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(badge.percentage_of_total, 100)}%`,
                  backgroundColor: badge.color
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Indicateur d'inactivité */}
      {!badge.is_active && (
        <div className="mt-4 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full text-center">
          Badge archivé
        </div>
      )}
    </div>
  );
}
