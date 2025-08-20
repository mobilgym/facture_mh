import React from 'react';
import { X } from 'lucide-react';
import type { Badge as BadgeType } from '../../types/badge';

interface BadgeProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'solid';
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

export function Badge({ 
  badge, 
  size = 'md', 
  variant = 'default',
  removable = false,
  onRemove,
  onClick,
  className = ''
}: BadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    default: 'bg-opacity-10 text-opacity-90 border border-opacity-20',
    outline: 'bg-transparent border-2',
    solid: 'text-white border-transparent'
  };

  const baseClasses = `
    inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200
    ${sizeClasses[size]} 
    ${variantClasses[variant]}
    ${onClick ? 'cursor-pointer hover:bg-opacity-20' : ''}
    ${className}
  `;

  const badgeStyle = {
    backgroundColor: variant === 'solid' 
      ? badge.color 
      : variant === 'default' 
        ? `${badge.color}1A` 
        : 'transparent',
    color: variant === 'solid' ? 'white' : badge.color,
    borderColor: badge.color
  };

  return (
    <span 
      className={baseClasses}
      style={badgeStyle}
      onClick={onClick}
      title={badge.description}
    >
      {/* Icône optionnelle */}
      {badge.icon && (
        <span className="flex-shrink-0">
          {/* Ici on pourrait mapper les icônes */}
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: badge.color }} />
        </span>
      )}
      
      {/* Nom du badge */}
      <span className="truncate">
        {badge.name}
      </span>

      {/* Bouton de suppression */}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
