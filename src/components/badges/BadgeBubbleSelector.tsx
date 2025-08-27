import React from 'react';
import { BubblePicker } from '../ui/BubblePicker';
import type { Badge } from '../../types/badge';

interface BadgeBubbleSelectorProps {
  badges: Badge[];
  selectedBadges: Badge[];
  onBadgeSelect: (badge: Badge) => void;
  onBadgeRemove: (badgeId: string) => void;
  maxSelection?: number;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function BadgeBubbleSelector({
  badges,
  selectedBadges,
  onBadgeSelect,
  onBadgeRemove,
  maxSelection,
  loading = false,
  disabled = false,
  className = ''
}: BadgeBubbleSelectorProps) {
  // Filtrer les badges actifs
  const activeBadges = badges.filter(badge => badge.is_active);

  // Transformer les badges en format BubbleItem
  const badgeItems = activeBadges.map(badge => ({
    id: badge.id,
    name: badge.name,
    color: badge.color,
    description: badge.description || undefined,
    subtitle: undefined,
    disabled: false
  }));

  const selectedItems = selectedBadges.map(badge => 
    badgeItems.find(item => item.id === badge.id)
  ).filter(Boolean) as any[];

  const handleItemSelect = (item: any) => {
    const badge = badges.find(b => b.id === item.id);
    if (badge) {
      onBadgeSelect(badge);
    }
  };

  const handleItemRemove = (itemId: string) => {
    onBadgeRemove(itemId);
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Badges
        </label>
        <div className="w-full flex items-center justify-center px-4 py-6 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Chargement des badges...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BubblePicker
      items={badgeItems}
      selectedItems={selectedItems}
      onItemSelect={handleItemSelect}
      onItemRemove={handleItemRemove}
      placeholder={selectedBadges.length === 0 ? "Cliquer pour sélectionner des badges" : undefined}
      label="Badges"
      disabled={disabled}
      allowMultiple={true}
      searchable={true}
      maxSelection={maxSelection}
      emptyMessage="Aucun badge disponible"
      className={className}
    />
  );
}
