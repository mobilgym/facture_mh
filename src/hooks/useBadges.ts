import { useState, useEffect, useCallback } from 'react';
import { BadgeService } from '../lib/services/badgeService';
import type { 
  Badge, 
  BadgeWithStats, 
  CreateBadgeForm, 
  UpdateBadgeForm,
  BadgeAnalysis
} from '../types/badge';
import { useToast } from './useToast';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useBudgetNotification } from '../contexts/BudgetNotificationContext';

export function useBadges() {
  const [badges, setBadges] = useState<BadgeWithStats[]>([]);
  const [activeBadges, setActiveBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { onBudgetChange } = useBudgetNotification();

  // Charger les badges avec statistiques
  const loadBadges = useCallback(async () => {
    if (!selectedCompany) return;
    
    try {
      setLoading(true);
      const badgesData = await BadgeService.getBadgesByCompany(selectedCompany.id);
      setBadges(badgesData);
    } catch (error) {
      console.error('Erreur lors du chargement des badges:', error);
      showError('Erreur lors du chargement des badges');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, showError]);

  // Charger les badges actifs (pour les sélecteurs)
  const loadActiveBadges = useCallback(async () => {
    if (!selectedCompany) return;
    
    try {
      const activeBadgesData = await BadgeService.getActiveBadges(selectedCompany.id);
      setActiveBadges(activeBadgesData);
    } catch (error) {
      console.error('Erreur lors du chargement des badges actifs:', error);
      showError('Erreur lors du chargement des badges actifs');
    }
  }, [selectedCompany, showError]);

  // Créer un badge
  const createBadge = async (badgeData: CreateBadgeForm): Promise<Badge | null> => {
    if (!selectedCompany || !user) return null;

    try {
      const newBadge = await BadgeService.createBadge(
        selectedCompany.id,
        user.id,
        badgeData
      );
      
      showSuccess('Badge créé avec succès');
      await loadBadges();
      await loadActiveBadges();
      return newBadge;
    } catch (error) {
      console.error('Erreur lors de la création du badge:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors de la création du badge'
      );
      return null;
    }
  };

  // Mettre à jour un badge
  const updateBadge = async (badgeId: string, updates: UpdateBadgeForm): Promise<boolean> => {
    try {
      await BadgeService.updateBadge(badgeId, updates);
      showSuccess('Badge mis à jour avec succès');
      await loadBadges();
      await loadActiveBadges();
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du badge:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors de la mise à jour du badge'
      );
      return false;
    }
  };

  // Archiver un badge
  const archiveBadge = async (badgeId: string): Promise<boolean> => {
    try {
      await BadgeService.archiveBadge(badgeId);
      showSuccess('Badge archivé avec succès');
      await loadBadges();
      await loadActiveBadges();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'archivage du badge:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors de l\'archivage du badge'
      );
      return false;
    }
  };

  // Supprimer un badge
  const deleteBadge = async (badgeId: string): Promise<boolean> => {
    try {
      await BadgeService.deleteBadge(badgeId);
      showSuccess('Badge supprimé avec succès');
      await loadBadges();
      await loadActiveBadges();
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du badge:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors de la suppression du badge'
      );
      return false;
    }
  };

  // Réactiver un badge
  const reactivateBadge = async (badgeId: string): Promise<boolean> => {
    try {
      await BadgeService.reactivateBadge(badgeId);
      showSuccess('Badge réactivé avec succès');
      await loadBadges();
      await loadActiveBadges();
      return true;
    } catch (error) {
      console.error('Erreur lors de la réactivation du badge:', error);
      showError(
        error instanceof Error ? error.message : 'Erreur lors de la réactivation du badge'
      );
      return false;
    }
  };

  // Récupérer un badge par ID
  const getBadgeById = async (badgeId: string): Promise<Badge | null> => {
    try {
      return await BadgeService.getBadgeById(badgeId);
    } catch (error) {
      console.error('Erreur lors de la récupération du badge:', error);
      showError('Erreur lors de la récupération du badge');
      return null;
    }
  };

  // Générer une analyse des badges
  const generateAnalysis = async (
    budgetId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<BadgeAnalysis[]> => {
    if (!selectedCompany) return [];

    try {
      return await BadgeService.getBadgeAnalysis(
        selectedCompany.id,
        budgetId,
        startDate,
        endDate
      );
    } catch (error) {
      console.error('Erreur lors de la génération de l\'analyse:', error);
      showError('Erreur lors de la génération de l\'analyse');
      return [];
    }
  };

  // Charger les données au montage et quand l'entreprise change
  useEffect(() => {
    if (selectedCompany) {
      loadBadges();
      loadActiveBadges();
    }
  }, [selectedCompany, loadBadges, loadActiveBadges]);

  // S'abonner aux notifications de changement de budget pour rafraîchir les données
  useEffect(() => {
    if (!selectedCompany) return;
    
    const unsubscribe = onBudgetChange(() => {
      console.log('🔔 useBadges - Notification reçue, rafraîchissement des badges');
      loadBadges();
      loadActiveBadges();
    });

    return unsubscribe;
  }, [onBudgetChange, selectedCompany, loadBadges, loadActiveBadges]);

  return {
    badges,
    activeBadges,
    loading,
    createBadge,
    updateBadge,
    archiveBadge,
    deleteBadge,
    reactivateBadge,
    getBadgeById,
    generateAnalysis,
    refreshBadges: () => {
      loadBadges();
      loadActiveBadges();
    }
  };
}
