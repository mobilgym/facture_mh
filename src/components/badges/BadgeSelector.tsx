import React, { useState } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { Badge } from './Badge';
import type { Badge as BadgeType } from '../../types/badge';

interface BadgeSelectorProps {
  availableBadges: BadgeType[];
  selectedBadges: BadgeType[];
  onBadgeSelect: (badge: BadgeType) => void;
  onBadgeRemove: (badgeId: string) => void;
  placeholder?: string;
  maxSelection?: number;
  disabled?: boolean;
  className?: string;
}

export function BadgeSelector({
  availableBadges,
  selectedBadges,
  onBadgeSelect,
  onBadgeRemove,
  placeholder = "Sélectionner des badges...",
  maxSelection,
  disabled = false,
  className = ''
}: BadgeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les badges disponibles
  const filteredBadges = availableBadges.filter(badge => {
    const isAlreadySelected = selectedBadges.some(selected => selected.id === badge.id);
    const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase());
    return !isAlreadySelected && matchesSearch;
  });

  const canAddMore = !maxSelection || selectedBadges.length < maxSelection;

  const handleBadgeClick = (badge: BadgeType) => {
    if (!disabled && canAddMore) {
      onBadgeSelect(badge);
      setSearchTerm('');
    }
  };

  const handleRemoveBadge = (badgeId: string) => {
    if (!disabled) {
      onBadgeRemove(badgeId);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Badges sélectionnés */}
      {selectedBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedBadges.map(badge => (
            <Badge
              key={badge.id}
              badge={badge}
              size="sm"
              variant="default"
              removable={!disabled}
              onRemove={() => handleRemoveBadge(badge.id)}
            />
          ))}
        </div>
      )}

      {/* Sélecteur */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && canAddMore && setIsOpen(!isOpen)}
          disabled={disabled || !canAddMore}
          className={`
            w-full flex items-center justify-between px-3 py-2 
            border border-gray-300 rounded-lg bg-white
            ${disabled || !canAddMore 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'
            }
            transition-all duration-200
          `}
        >
          <span className={selectedBadges.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
            {selectedBadges.length > 0 
              ? `${selectedBadges.length} badge${selectedBadges.length > 1 ? 's' : ''} sélectionné${selectedBadges.length > 1 ? 's' : ''}`
              : placeholder
            }
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isOpen && !disabled && canAddMore && (
          <div className="absolute z-50 w-full bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
            {/* Barre de recherche */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un badge..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Liste des badges */}
            <div className="max-h-48 overflow-y-auto">
              {filteredBadges.length > 0 ? (
                <div className="p-2">
                  {filteredBadges.map(badge => (
                    <button
                      key={badge.id}
                      onClick={() => {
                        handleBadgeClick(badge);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: badge.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {badge.name}
                        </p>
                        {badge.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {badge.description}
                          </p>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'Aucun badge trouvé' : 'Tous les badges sont déjà sélectionnés'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Limite atteinte */}
      {maxSelection && selectedBadges.length >= maxSelection && (
        <p className="mt-1 text-xs text-gray-500">
          Limite atteinte ({selectedBadges.length}/{maxSelection})
        </p>
      )}

      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
