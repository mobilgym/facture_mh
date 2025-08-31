import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Tag, Zap, Check } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { useBudgetBadges } from '@/hooks/useBudgetBadges';
import { updateFileWithBadges } from '@/lib/services/fileUpdateService';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import type { FileItem } from '@/types/file';
import type { Badge } from '@/types/badge';

interface QuickAssignmentPopupProps {
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete: () => void;
  position: { x: number; y: number };
}

export default function QuickAssignmentPopup({
  file,
  isOpen,
  onClose,
  onAssignmentComplete,
  position
}: QuickAssignmentPopupProps) {
  const { user } = useAuth();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(file.budget_id || null);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>(file.badge_ids || []);
  const [isAssigning, setIsAssigning] = useState(false);
  const [success, setSuccess] = useState(false);

  const { badges: availableBadges, loading: badgesLoading } = useBudgetBadges(selectedBudgetId || undefined);

  // Réinitialiser les sélections quand le fichier change
  useEffect(() => {
    if (file) {
      setSelectedBudgetId(file.budget_id || null);
      setSelectedBadgeIds(file.badge_ids || []);
      setSuccess(false);
    }
  }, [file]);

  // Fermer automatiquement après succès
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const activeBudgets = budgets?.filter(budget => budget.is_active === true) || [];

  const handleBudgetSelect = (budgetId: string) => {
    if (selectedBudgetId === budgetId) {
      setSelectedBudgetId(null);
      setSelectedBadgeIds([]);
    } else {
      setSelectedBudgetId(budgetId);
      setSelectedBadgeIds([]);
    }
  };

  const handleBadgeToggle = (badgeId: string) => {
    setSelectedBadgeIds(prev => 
      prev.includes(badgeId)
        ? prev.filter(id => id !== badgeId)
        : [...prev, badgeId]
    );
  };

  const handleAssign = async () => {
    if (!user || (!selectedBudgetId && selectedBadgeIds.length === 0)) return;

    setIsAssigning(true);
    try {
      // Préparer les mises à jour
      const updates: Partial<FileItem> = {};
      
      // Mise à jour du budget si changé
      if (selectedBudgetId !== file.budget_id) {
        updates.budget_id = selectedBudgetId;
      }
      
      // Mise à jour des badges si changés
      if (JSON.stringify(selectedBadgeIds.sort()) !== JSON.stringify((file.badge_ids || []).sort())) {
        updates.badge_ids = selectedBadgeIds.length > 0 ? selectedBadgeIds : null;
      }

      // Appeler le service de mise à jour uniquement s'il y a des changements
      if (Object.keys(updates).length > 0) {
        console.log('🔄 Mise à jour du fichier:', file.id, updates);
        await updateFileWithBadges(file.id, updates, user.id);
        console.log('✅ Assignation réussie !');
      }

      setSuccess(true);
      onAssignmentComplete();
    } catch (error) {
      console.error('❌ Erreur lors de l\'assignation:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Calculer la position du popup pour qu'il reste dans l'écran
  const getPopupStyle = () => {
    const popupWidth = 320;
    const popupHeight = 400;
    const margin = 16;
    
    let x = position.x;
    let y = position.y;
    
    // Ajuster horizontalement
    if (x + popupWidth > window.innerWidth - margin) {
      x = window.innerWidth - popupWidth - margin;
    }
    if (x < margin) {
      x = margin;
    }
    
    // Ajuster verticalement
    if (y + popupHeight > window.innerHeight - margin) {
      y = window.innerHeight - popupHeight - margin;
    }
    if (y < margin) {
      y = margin;
    }
    
    return {
      left: `${x}px`,
      top: `${y}px`
    };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateX: -10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotateX: -10 }}
          className="absolute bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 max-h-96 overflow-hidden"
          style={getPopupStyle()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header avec animation de succès */}
          <div className={`px-4 py-3 border-b border-gray-200 transition-all duration-500 ${
            success ? 'bg-green-50 border-green-200' : 'bg-gradient-to-r from-blue-50 to-purple-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={success ? { scale: [1, 1.2, 1], rotate: [0, 360] } : {}}
                  transition={{ duration: 0.6 }}
                  className={`p-1.5 rounded-full ${
                    success ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                >
                  {success ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <Zap className="h-4 w-4 text-white" />
                  )}
                </motion.div>
                <h3 className={`font-semibold transition-colors duration-300 ${
                  success ? 'text-green-700' : 'text-gray-900'
                }`}>
                  {success ? 'Assignation réussie !' : 'Assignation rapide'}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!success && (
            <div className="p-4 max-h-80 overflow-y-auto">
              {/* Info fichier */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm text-gray-900 truncate" title={file.name}>
                  {file.name}
                </div>
                {file.amount && (
                  <div className="text-xs text-gray-500 mt-1">
                    Montant: {file.amount.toFixed(2)}€
                  </div>
                )}
              </div>

              {/* Sélection Budget */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm text-gray-700">Budget</span>
                </div>
                
                {budgetsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-10 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {activeBudgets.map((budget) => (
                      <motion.button
                        key={budget.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBudgetSelect(budget.id)}
                        className={`w-full p-2 rounded-lg border-2 transition-all text-left ${
                          selectedBudgetId === budget.id
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-900">
                          {budget.name}
                        </div>
                        {budget.total_budget && (
                          <div className="text-xs text-gray-500 mt-1">
                            Budget: {budget.total_budget.toFixed(2)}€
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sélection Badges */}
              {selectedBudgetId && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Tag className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-sm text-gray-700">Badges</span>
                  </div>
                  
                  {badgesLoading ? (
                    <div className="animate-pulse grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-8 bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {availableBadges?.map((badge: Badge) => (
                        <motion.button
                          key={badge.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleBadgeToggle(badge.id)}
                          className={`p-2 rounded-lg border-2 transition-all text-center ${
                            selectedBadgeIds.includes(badge.id)
                              ? 'border-purple-500 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{
                            backgroundColor: selectedBadgeIds.includes(badge.id) 
                              ? `${badge.color}20` 
                              : 'white',
                            borderColor: selectedBadgeIds.includes(badge.id)
                              ? badge.color
                              : undefined
                          }}
                        >
                          <div 
                            className="w-3 h-3 rounded-full mx-auto mb-1"
                            style={{ backgroundColor: badge.color }}
                          ></div>
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {badge.name}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isAssigning}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAssign}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  disabled={isAssigning || (!selectedBudgetId && selectedBadgeIds.length === 0)}
                >
                  {isAssigning ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Attribution...</span>
                    </div>
                  ) : (
                    'Assigner'
                  )}
                </Button>
              </div>
            </div>
          )}

          {success && (
            <div className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <Check className="h-8 w-8 text-green-600" />
              </motion.div>
              <div className="text-green-700 font-medium">
                Budget et badges assignés avec succès !
              </div>
              <div className="text-xs text-green-600 mt-1">
                Fermeture automatique...
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}