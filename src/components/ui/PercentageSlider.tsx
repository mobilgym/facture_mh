import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Percent, Calculator } from 'lucide-react';
import PercentageTooltip from './PercentageTooltip';
import AmountDisplay from './AmountDisplay';

interface PercentageSliderProps {
  totalAmount: number;
  percentage: number;
  onPercentageChange: (percentage: number) => void;
  label?: string;
  disabled?: boolean;
  showManualInput?: boolean;
  className?: string;
}

export default function PercentageSlider({
  totalAmount,
  percentage,
  onPercentageChange,
  label = "Pourcentage à retenir",
  disabled = false,
  showManualInput = true,
  className = ""
}: PercentageSliderProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState(percentage.toString());
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Calcul du montant retenu
  const retainedAmount = (totalAmount * percentage) / 100;
  
  // État pour le montant précédent (initialisé après le calcul)
  const [previousAmount, setPreviousAmount] = useState<number>(retainedAmount);

  // Mettre à jour l'input quand le pourcentage change
  useEffect(() => {
    if (!showInput) {
      setInputValue(percentage.toString());
    }
  }, [percentage, showInput]);

  // Initialiser le montant précédent au premier rendu
  useEffect(() => {
    setPreviousAmount(retainedAmount);
  }, []);

  // Suivre les changements de montant pour l'animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviousAmount(retainedAmount);
    }, 100);
    return () => clearTimeout(timer);
  }, [retainedAmount]);

  // Gérer le drag du curseur
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updatePercentage(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || disabled) return;
    updatePercentage(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updatePercentage = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercentage = Math.round((x / rect.width) * 100);
    
    onPercentageChange(Math.max(0, Math.min(100, newPercentage)));
  };

  // Gérer les événements globaux de souris
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Gérer la navigation au clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    let newPercentage = percentage;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newPercentage = Math.max(0, percentage - (e.shiftKey ? 10 : 1));
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newPercentage = Math.min(100, percentage + (e.shiftKey ? 10 : 1));
        break;
      case 'Home':
        e.preventDefault();
        newPercentage = 0;
        break;
      case 'End':
        e.preventDefault();
        newPercentage = 100;
        break;
      case 'PageDown':
        e.preventDefault();
        newPercentage = Math.max(0, percentage - 25);
        break;
      case 'PageUp':
        e.preventDefault();
        newPercentage = Math.min(100, percentage + 25);
        break;
      default:
        return;
    }
    
    onPercentageChange(newPercentage);
  };

  // Gérer la saisie manuelle
  const handleInputSubmit = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      onPercentageChange(value);
    }
    setShowInput(false);
    setInputValue(percentage.toString());
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setInputValue(percentage.toString());
    }
  };

  // Présets de pourcentages rapides
  const presets = [0, 25, 50, 75, 100];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* En-tête avec label et montant total */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 flex items-center space-x-2">
          <Percent className="h-4 w-4 text-blue-600" />
          <span>{label}</span>
          <PercentageTooltip 
            totalAmount={totalAmount}
            percentage={percentage}
            retainedAmount={retainedAmount}
          />
        </label>
        <div className="text-sm text-gray-500">
          Total: <span className="font-semibold text-gray-700">{totalAmount.toFixed(2)}€</span>
        </div>
      </div>

      {/* Présets rapides */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Présets:</span>
        <div className="flex space-x-1">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => !disabled && onPercentageChange(preset)}
              disabled={disabled}
              className={`
                px-2 py-1 text-xs rounded-md transition-all duration-200
                ${percentage === preset 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
              `}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      {/* Curseur principal */}
      <div 
        className={`relative ${disabled ? 'opacity-50' : ''}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        ref={sliderRef}
      >
        {/* Track du curseur */}
        <div
          ref={trackRef}
          className="relative h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
          onMouseDown={handleMouseDown}
        >
          {/* Progression colorée */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            style={{ width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
          
          {/* Effet de brillance */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            style={{ width: `${percentage}%` }}
            animate={{ 
              width: `${percentage}%`,
              opacity: isHovering || isDragging ? 0.4 : 0.2 
            }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Poignée du curseur */}
        <motion.div
          className={`
            absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-blue-600 
            rounded-full shadow-lg cursor-grab transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${isDragging ? 'cursor-grabbing scale-110 shadow-xl' : ''}
            ${isHovering ? 'scale-105' : ''}
          `}
          style={{ left: `calc(${percentage}% - 10px)` }}
          animate={{ 
            scale: isDragging ? 1.1 : isHovering ? 1.05 : 1,
            boxShadow: isDragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.25)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-label={`Pourcentage du montant à retenir: ${percentage}%`}
        >
          {/* Indicateur central */}
          <div className="absolute inset-1 bg-blue-600 rounded-full" />
        </motion.div>

        {/* Tooltip flottant */}
        <AnimatePresence>
          {(isHovering || isDragging) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg"
              style={{ left: `calc(${percentage}% - 25px)` }}
            >
              {percentage}%
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Affichage des valeurs et saisie manuelle */}
      <div className="flex items-center justify-between space-x-4">
        {/* Pourcentage affiché */}
        <div className="flex items-center space-x-2">
          {showManualInput && !showInput ? (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              disabled={disabled}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <Calculator className="h-4 w-4" />
              <span>{percentage}%</span>
            </button>
          ) : showInput ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyPress}
                onBlur={handleInputSubmit}
                className="w-20 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          ) : (
            <div className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
              {percentage}%
            </div>
          )}
        </div>

        {/* Montant retenu */}
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Montant retenu</div>
          <AmountDisplay
            amount={retainedAmount}
            previousAmount={previousAmount}
            size="md"
            showTrend={previousAmount !== undefined && Math.abs(retainedAmount - previousAmount) > 0.01}
            className="text-green-600"
          />
        </div>
      </div>

      {/* Barre de progression colorée pour feedback visuel */}
      <div className="flex h-1 rounded-full overflow-hidden bg-gray-100">
        {/* Zone rouge (0-33%) */}
        <motion.div
          className="bg-red-500"
          style={{ width: '33.33%' }}
          animate={{ opacity: percentage <= 33 ? 1 : 0.3 }}
        />
        {/* Zone orange (33-66%) */}
        <motion.div
          className="bg-orange-500"
          style={{ width: '33.33%' }}
          animate={{ opacity: percentage > 33 && percentage <= 66 ? 1 : 0.3 }}
        />
        {/* Zone verte (66-100%) */}
        <motion.div
          className="bg-green-500"
          style={{ width: '33.34%' }}
          animate={{ opacity: percentage > 66 ? 1 : 0.3 }}
        />
      </div>
    </div>
  );
}
