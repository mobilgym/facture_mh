import { useState, useEffect, useCallback } from 'react';
import { BadgeService } from '../lib/services/badgeService';
import type { Badge } from '../types/badge';
import { useToast } from './useToast';
import { useAuth } from '../contexts/AuthContext';

export function useBudgetBadges(budgetId?: string) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();

  // Charger les badges du budget
  const loadBadges = useCallback(async () => {
    if (!budgetId) {
      setBadges([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const badgesData = await BadgeService.getBadgesByBudget(budgetId);
      setBadges(badgesData);
    } catch (error) {
      console.error('Erreur lors du chargement des badges du budget:', error);
      showError('Erreur lors du chargement des badges du budget');
    } finally {
      setLoading(false);
    }
  }, [budgetId, showError]);

  // Assigner un badge au budget
  const assignBadge = async (badgeId: string) => {
    if (!budgetId || !user) return;

    try {
      // Récupérer les badges actuels et ajouter le nouveau
      const currentBadgeIds = badges.map(b => b.id);
      const newBadgeIds = [...currentBadgeIds, badgeId];
      
      await BadgeService.updateBudgetBadges(budgetId, newBadgeIds, user.id);
      showSuccess('Badge assigné avec succès');
      await loadBadges();
    } catch (error) {
      console.error('Erreur lors de l\'assignation du badge:', error);
      showError('Erreur lors de l\'assignation du badge');
    }
  };

  // Retirer un badge du budget
  const removeBadge = async (badgeId: string) => {
    if (!budgetId || !user) return;

    try {
      // Récupérer les badges actuels et retirer celui-ci
      const currentBadgeIds = badges.map(b => b.id);
      const newBadgeIds = currentBadgeIds.filter(id => id !== badgeId);
      
      await BadgeService.updateBudgetBadges(budgetId, newBadgeIds, user.id);
      showSuccess('Badge retiré avec succès');
      await loadBadges();
    } catch (error) {
      console.error('Erreur lors du retrait du badge:', error);
      showError('Erreur lors du retrait du badge');
    }
  };

  // Mettre à jour tous les badges du budget
  const updateBadges = async (badgeIds: string[]) => {
    if (!budgetId || !user) return;

    try {
      await BadgeService.updateBudgetBadges(budgetId, badgeIds, user.id);
      showSuccess('Badges mis à jour avec succès');
      await loadBadges();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des badges:', error);
      showError('Erreur lors de la mise à jour des badges');
    }
  };

  // Charger les données quand le budget change
  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  return {
    badges,
    loading,
    assignBadge,
    removeBadge,
    updateBadges,
    refreshBadges: loadBadges
  };
}
