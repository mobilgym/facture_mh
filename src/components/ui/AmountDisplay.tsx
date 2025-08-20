import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AmountDisplayProps {
  amount: number;
  previousAmount?: number;
  currency?: string;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AmountDisplay({
  amount,
  previousAmount,
  currency = '€',
  showTrend = true,
  size = 'md',
  className = ""
}: AmountDisplayProps) {
  const difference = previousAmount !== undefined ? amount - previousAmount : 0;
  const isIncrease = difference > 0;
  const isDecrease = difference < 0;
  const isEqual = difference === 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const trendIcon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  const trendColor = isIncrease 
    ? 'text-green-600' 
    : isDecrease 
    ? 'text-red-600' 
    : 'text-gray-500';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Montant principal avec animation */}
      <motion.span
        key={amount}
        initial={{ scale: 1.1, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
        className={`font-bold ${sizeClasses[size]} text-gray-900`}
      >
        {amount.toFixed(2)}{currency}
      </motion.span>

      {/* Indicateur de tendance */}
      {showTrend && previousAmount !== undefined && !isEqual && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 0.4,
            type: "spring",
            stiffness: 300
          }}
          className={`flex items-center space-x-1 ${trendColor}`}
        >
          <TrendIcon className="h-4 w-4" />
          <span className="text-xs font-medium">
            {Math.abs(difference).toFixed(2)}{currency}
          </span>
        </motion.div>
      )}

      {/* Animation de particules pour les changements importants */}
      {Math.abs(difference) > amount * 0.1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Particules animées */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                scale: 0, 
                x: 0, 
                y: 0,
                opacity: 1
              }}
              animate={{ 
                scale: [0, 1, 0],
                x: [0, (i - 1) * 20, (i - 1) * 40],
                y: [0, -10 - i * 5, -20 - i * 10],
                opacity: [1, 0.7, 0]
              }}
              transition={{ 
                duration: 1,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className={`absolute w-1 h-1 rounded-full ${
                isIncrease ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
