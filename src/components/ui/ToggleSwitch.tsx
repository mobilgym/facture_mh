import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function ToggleSwitch({ 
  enabled, 
  onChange, 
  label, 
  size = 'md', 
  disabled = false,
  className = '' 
}: ToggleSwitchProps) {
  const sizeClasses = {
    sm: {
      container: 'w-8 h-4',
      toggle: 'w-3 h-3',
      translate: enabled ? 'translate-x-4' : 'translate-x-0'
    },
    md: {
      container: 'w-11 h-6',
      toggle: 'w-5 h-5',
      translate: enabled ? 'translate-x-5' : 'translate-x-0'
    },
    lg: {
      container: 'w-14 h-7',
      toggle: 'w-6 h-6',
      translate: enabled ? 'translate-x-7' : 'translate-x-0'
    }
  };

  const currentSize = sizeClasses[size];

  const handleToggle = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <label className="mr-3 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          ${currentSize.container}
          relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${enabled 
            ? 'bg-blue-600' 
            : 'bg-gray-200'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-blue-700'
          }
        `}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
      >
        <span
          className={`
            ${currentSize.toggle}
            ${currentSize.translate}
            pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 
            transition duration-200 ease-in-out
          `}
        />
      </button>
    </div>
  );
}
