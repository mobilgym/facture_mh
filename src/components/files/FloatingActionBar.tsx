import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Tag, Trash2, Download, Archive } from 'lucide-react';
import Button from '@/components/ui/Button';

interface FloatingActionBarProps {
  selectedCount: number;
  onClose: () => void;
  onBulkAction: (action: string) => void;
}

export default function FloatingActionBar({
  selectedCount,
  onClose,
  onBulkAction
}: FloatingActionBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleAction = (action: string) => {
    onBulkAction(action);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-2xl shadow-2xl px-4 py-3">
          <div className="flex items-center space-x-3">
            {/* Compteur de sélection */}
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </div>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('assign-budget')}
                className="hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
                title="Assigner un budget"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Budget</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('assign-badges')}
                className="hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200"
                title="Assigner des badges"
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Badges</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('remove-assignments')}
                className="hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                title="Retirer les assignations"
              >
                <Archive className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Retirer</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('download')}
                className="hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                title="Télécharger"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Télécharger</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('delete')}
                className="hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Supprimer</span>
              </Button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Bouton fermer */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100 transition-colors duration-200"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
