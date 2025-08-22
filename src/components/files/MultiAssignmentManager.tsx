import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Wallet, Tag, Percent, Calculator, AlertCircle } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { useBudgetBadges } from '@/hooks/useBudgetBadges';
// Removed PercentageSlider import - using custom slider instead
import Button from '@/components/ui/Button';
import type { Badge } from '@/types/badge';

export interface AssignmentItem {
  id: string;
  budgetId: string | null;
  budgetName?: string;
  badgeId: string | null;
  badgeName?: string;
  badgeColor?: string;
  percentage: number;
  amount: number;
}

interface MultiAssignmentManagerProps {
  totalAmount: number;
  assignments: AssignmentItem[];
  onAssignmentsChange: (assignments: AssignmentItem[]) => void;
  className?: string;
}

export default function MultiAssignmentManager({
  totalAmount,
  assignments,
  onAssignmentsChange,
  className = ''
}: MultiAssignmentManagerProps) {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const [localAssignments, setLocalAssignments] = useState<AssignmentItem[]>(assignments);

  // Synchroniser avec les props
  useEffect(() => {
    setLocalAssignments(assignments);
  }, [assignments]);

  // Calculer le pourcentage total utilisé
  const totalPercentageUsed = useMemo(() => {
    return localAssignments.reduce((sum, assignment) => sum + assignment.percentage, 0);
  }, [localAssignments]);

  // Calculer le montant restant
  const remainingAmount = useMemo(() => {
    const usedAmount = localAssignments.reduce((sum, assignment) => sum + assignment.amount, 0);
    return totalAmount - usedAmount;
  }, [totalAmount, localAssignments]);

  // Calculer automatiquement les montants basés sur les pourcentages
  const updateAssignmentAmounts = (assignments: AssignmentItem[]) => {
    const updatedAssignments = assignments.map(assignment => ({
      ...assignment,
      amount: Math.round((assignment.percentage / 100) * totalAmount * 100) / 100
    }));
    return updatedAssignments;
  };

  // Mettre à jour un assignment
  const updateAssignment = (id: string, updates: Partial<AssignmentItem>) => {
    const updatedAssignments = localAssignments.map(assignment =>
      assignment.id === id ? { ...assignment, ...updates } : assignment
    );

    // Recalculer les montants si le pourcentage a changé
    if ('percentage' in updates) {
      const finalAssignments = updateAssignmentAmounts(updatedAssignments);
      setLocalAssignments(finalAssignments);
      onAssignmentsChange(finalAssignments);
    } else {
      setLocalAssignments(updatedAssignments);
      onAssignmentsChange(updatedAssignments);
    }
  };

  // Ajouter un nouvel assignment
  const addAssignment = () => {
    const newAssignment: AssignmentItem = {
      id: `assignment-${Date.now()}`,
      budgetId: null,
      badgeId: null,
      percentage: Math.min(25, 100 - totalPercentageUsed), // 25% par défaut ou le restant
      amount: 0
    };

    const updatedAssignments = [...localAssignments, newAssignment];
    const finalAssignments = updateAssignmentAmounts(updatedAssignments);
    setLocalAssignments(finalAssignments);
    onAssignmentsChange(finalAssignments);
  };

  // Supprimer un assignment
  const removeAssignment = (id: string) => {
    const updatedAssignments = localAssignments.filter(assignment => assignment.id !== id);
    const finalAssignments = updateAssignmentAmounts(updatedAssignments);
    setLocalAssignments(finalAssignments);
    onAssignmentsChange(finalAssignments);
  };

  // Répartir équitablement les pourcentages
  const distributeEqually = () => {
    if (localAssignments.length === 0) return;

    const percentagePerAssignment = Math.floor(100 / localAssignments.length);
    const remainder = 100 - (percentagePerAssignment * localAssignments.length);

    const updatedAssignments = localAssignments.map((assignment, index) => ({
      ...assignment,
      percentage: percentagePerAssignment + (index < remainder ? 1 : 0)
    }));

    const finalAssignments = updateAssignmentAmounts(updatedAssignments);
    setLocalAssignments(finalAssignments);
    onAssignmentsChange(finalAssignments);
  };

  // Budgets disponibles (actifs)
  const availableBudgets = budgets?.filter(budget => budget.is_active) || [];

  return (
    <div className={className}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Répartition Budgets & Badges
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={distributeEqually}
              disabled={localAssignments.length === 0}
              className="text-xs"
            >
              <Percent className="h-4 w-4 mr-1" />
              Répartir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addAssignment}
              disabled={totalPercentageUsed >= 100}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Résumé global */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500">Montant Total</p>
            <p className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(totalAmount)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Pourcentage Utilisé</p>
            <p className={`text-lg font-bold ${
              totalPercentageUsed > 100 ? 'text-red-600' : 'text-blue-600'
            }`}>
              {totalPercentageUsed}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Montant Restant</p>
            <p className={`text-lg font-bold ${
              remainingAmount < 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(remainingAmount)}
            </p>
          </div>
        </div>

        {/* Alerte si dépassement */}
        {totalPercentageUsed > 100 && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700">
              Le pourcentage total dépasse 100%. Ajustez les répartitions.
            </p>
          </div>
        )}

        {/* Liste des assignments */}
        <div className="space-y-4">
          <AnimatePresence>
            {localAssignments.map((assignment, index) => (
              <AssignmentItem
                key={assignment.id}
                assignment={assignment}
                index={index + 1}
                availableBudgets={availableBudgets}
                onUpdate={(updates) => updateAssignment(assignment.id, updates)}
                onRemove={() => removeAssignment(assignment.id)}
                canRemove={localAssignments.length > 1}
              />
            ))}
          </AnimatePresence>

          {/* Message si aucun assignment */}
          {localAssignments.length === 0 && (
            <div className="text-center py-8">
              <Calculator className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucune répartition configurée
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Cliquez sur "Ajouter" pour créer votre première répartition.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant pour un item d'assignment individuel
interface AssignmentItemProps {
  assignment: AssignmentItem;
  index: number;
  availableBudgets: any[];
  onUpdate: (updates: Partial<AssignmentItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function AssignmentItem({
  assignment,
  index,
  availableBudgets,
  onUpdate,
  onRemove,
  canRemove
}: AssignmentItemProps) {
  const { badges: budgetBadges, loading: badgesLoading } = useBudgetBadges(assignment.budgetId || undefined);

  // Badges disponibles pour le budget sélectionné
  const availableBadges = budgetBadges?.filter(badge => badge.is_active) || [];

  // Sélectionner automatiquement le budget et badge pour affichage
  useEffect(() => {
    if (assignment.budgetId && availableBudgets.length > 0 && !assignment.budgetName) {
      const budget = availableBudgets.find(b => b.id === assignment.budgetId);
      if (budget) {
        onUpdate({ budgetName: budget.name });
      }
    }
  }, [assignment.budgetId, availableBudgets, assignment.budgetName, onUpdate]);

  useEffect(() => {
    if (assignment.badgeId && availableBadges.length > 0 && !assignment.badgeName) {
      const badge = availableBadges.find(b => b.id === assignment.badgeId);
      if (badge) {
        onUpdate({ 
          badgeName: badge.name,
          badgeColor: badge.color 
        });
      }
    }
  }, [assignment.badgeId, availableBadges, assignment.badgeName, onUpdate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border border-gray-200 rounded-lg p-4 bg-white"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-600">{index}</span>
          </div>
          <h4 className="font-medium text-gray-900">Répartition {index}</h4>
        </div>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Sélection du budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Wallet className="h-4 w-4 inline mr-1" />
            Budget
          </label>
          <select
            value={assignment.budgetId || ''}
            onChange={(e) => {
              const budgetId = e.target.value || null;
              const budget = availableBudgets.find(b => b.id === budgetId);
              onUpdate({ 
                budgetId,
                budgetName: budget?.name || undefined,
                badgeId: null, // Reset badge quand budget change
                badgeName: undefined,
                badgeColor: undefined
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner un budget</option>
            {availableBudgets.map((budget) => (
              <option key={budget.id} value={budget.id}>
                {budget.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sélection du badge */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="h-4 w-4 inline mr-1" />
            Badge
          </label>
          <select
            value={assignment.badgeId || ''}
            onChange={(e) => {
              const badgeId = e.target.value || null;
              const badge = availableBadges.find(b => b.id === badgeId);
              onUpdate({ 
                badgeId,
                badgeName: badge?.name || undefined,
                badgeColor: badge?.color || undefined
              });
            }}
            disabled={!assignment.budgetId || badgesLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {!assignment.budgetId 
                ? 'Sélectionnez d\'abord un budget'
                : badgesLoading 
                  ? 'Chargement...'
                  : 'Sélectionner un badge'
              }
            </option>
            {availableBadges.map((badge) => (
              <option key={badge.id} value={badge.id}>
                {badge.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Slider de pourcentage et montant */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pourcentage de répartition
          </label>
          <div className="space-y-2">
            {/* Slider simple */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={assignment.percentage}
                onChange={(e) => onUpdate({ percentage: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${assignment.percentage}%, #E5E7EB ${assignment.percentage}%, #E5E7EB 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            
            {/* Input numérique */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={assignment.percentage}
                onChange={(e) => {
                  const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                  onUpdate({ percentage: value });
                }}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </div>
        </div>

        {/* Affichage du montant calculé */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Montant assigné :</span>
          <span className="font-semibold text-lg text-green-600">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR'
            }).format(assignment.amount)}
          </span>
        </div>

        {/* Aperçu des sélections */}
        {(assignment.budgetName || assignment.badgeName) && (
          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
            {assignment.budgetName && (
              <div className="flex items-center space-x-1">
                <Wallet className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-700">{assignment.budgetName}</span>
              </div>
            )}
            {assignment.badgeName && (
              <div className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: assignment.badgeColor || '#6B7280' }}
                />
                <span className="text-xs text-blue-700">{assignment.badgeName}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
