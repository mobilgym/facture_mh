import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Tag, Check, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useBudgets } from '@/hooks/useBudgets';
import { useBadges } from '@/hooks/useBadges';
import { useBudgetBadges } from '@/hooks/useBudgetBadges';
import type { Budget } from '@/types/budget';
import type { Badge } from '@/types/badge';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFileIds: string[];
  action: 'assign-budget' | 'assign-badges' | 'remove-assignments';
  onConfirm: (data: any) => void;
}

export default function BulkActionModal({
  isOpen,
  onClose,
  selectedFileIds,
  action,
  onConfirm
}: BulkActionModalProps) {
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { budgets } = useBudgets();
  const { badges } = useBadges();
  const { badges: budgetBadges } = useBudgetBadges(selectedBudget || undefined);

  // Réinitialiser les sélections à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSelectedBudget('');
      setSelectedBadges([]);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      let data = {};
      
      switch (action) {
        case 'assign-budget':
          data = { budgetId: selectedBudget };
          break;
        case 'assign-badges':
          data = { 
            budgetId: selectedBudget || null,
            badgeIds: selectedBadges 
          };
          break;
        case 'remove-assignments':
          data = { removeAll: true };
          break;
      }

      await onConfirm(data);
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'action en lot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBadgeToggle = (badgeId: string) => {
    setSelectedBadges(prev => 
      prev.includes(badgeId) 
        ? prev.filter(id => id !== badgeId)
        : [...prev, badgeId]
    );
  };

  const getTitle = () => {
    switch (action) {
      case 'assign-budget':
        return 'Assigner un budget';
      case 'assign-badges':
        return 'Assigner des badges';
      case 'remove-assignments':
        return 'Retirer les assignations';
      default:
        return 'Action en lot';
    }
  };

  const getIcon = () => {
    switch (action) {
      case 'assign-budget':
        return <Wallet className="h-5 w-5 text-green-600" />;
      case 'assign-badges':
        return <Tag className="h-5 w-5 text-purple-600" />;
      case 'remove-assignments':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const canConfirm = () => {
    switch (action) {
      case 'assign-budget':
        return selectedBudget !== '';
      case 'assign-badges':
        return selectedBadges.length > 0;
      case 'remove-assignments':
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <h2 className="text-lg font-semibold text-gray-900">
                {getTitle()}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Contenu */}
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Cette action sera appliquée à <strong>{selectedFileIds.length}</strong> facture{selectedFileIds.length > 1 ? 's' : ''}
              </p>
            </div>

            {action === 'assign-budget' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Sélectionner un budget
                </label>
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir un budget...</option>
                  {budgets.filter(b => b.is_active).map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name} - {budget.remaining_amount.toFixed(2)}€ restant
                    </option>
                  ))}
                </select>
              </div>
            )}

            {action === 'assign-badges' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Budget (optionnel)
                </label>
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucun budget spécifique</option>
                  {budgets.filter(b => b.is_active).map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name}
                    </option>
                  ))}
                </select>

                <label className="block text-sm font-medium text-gray-700 mt-4">
                  Sélectionner des badges
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {(selectedBudget ? budgetBadges : badges.filter(b => b.is_active)).map(badge => (
                    <button
                      key={badge.id}
                      onClick={() => handleBadgeToggle(badge.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                        selectedBadges.includes(badge.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div 
                            className="w-3 h-3 rounded-full mb-1" 
                            style={{ backgroundColor: badge.color }}
                          ></div>
                          <div className="text-sm font-medium">{badge.name}</div>
                        </div>
                        {selectedBadges.includes(badge.id) && (
                          <Check className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedBudget && budgetBadges.length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    Aucun badge associé à ce budget
                  </p>
                )}
              </div>
            )}

            {action === 'remove-assignments' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">
                      Confirmer la suppression
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Cette action retirera tous les budgets et badges assignés aux factures sélectionnées.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Application...' : 'Confirmer'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
