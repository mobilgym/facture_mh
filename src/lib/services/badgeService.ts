import { supabase } from '../supabase';
import type { 
  Badge, 
  BadgeWithStats, 
  CreateBadgeForm, 
  UpdateBadgeForm,
  BadgeAnalysis,
  FileBadge,
  BudgetBadge
} from '../../types/badge';

/**
 * Service pour gérer les badges
 */
export class BadgeService {
  /**
   * Récupère tous les badges d'une entreprise avec statistiques
   */
  static async getBadgesByCompany(companyId: string): Promise<BadgeWithStats[]> {
    try {
      console.log('🔍 Récupération des badges pour l\'entreprise:', companyId);

      const { data: badges, error } = await supabase
        .from('badges')
        .select(`
          *,
          file_badges!file_badges_badge_id_fkey (
            id,
            amount_allocated,
            file:files(id, name, amount)
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des badges:', error);
        throw new Error(`Erreur lors de la récupération des badges: ${error.message}`);
      }

      // Calculer les statistiques
      let totalAmount = 0;
      const badgesData = badges?.map((badge: any) => {
        const fileBadges = badge.file_badges || [];
        
        // Calculer le montant total et le nombre de fichiers
        const badgeTotal = fileBadges.reduce((sum: number, fb: any) => {
          return sum + (fb.amount_allocated || fb.file?.amount || 0);
        }, 0);
        
        const filesCount = fileBadges.length;
        totalAmount += badgeTotal;

        return {
          ...badge,
          total_amount: badgeTotal,
          files_count: filesCount,
          expenses_count: filesCount, // Compatibilité
          percentage_of_total: 0 // Sera calculé après
        };
      }) || [];

      // Calculer les pourcentages
      const badgesWithStats: BadgeWithStats[] = badgesData.map(badge => ({
        ...badge,
        percentage_of_total: totalAmount > 0 
          ? Math.round((badge.total_amount / totalAmount) * 100 * 100) / 100 
          : 0
      }));

      console.log('✅ Badges récupérés avec succès:', badgesWithStats.length);
      return badgesWithStats;
    } catch (error) {
      console.error('❌ Erreur dans getBadgesByCompany:', error);
      throw error;
    }
  }

  /**
   * Récupère les badges actifs (pour les sélecteurs)
   */
  static async getActiveBadges(companyId: string): Promise<Badge[]> {
    try {
      const { data: badges, error } = await supabase
        .from('badges')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Erreur lors de la récupération des badges actifs: ${error.message}`);
      }

      return badges || [];
    } catch (error) {
      console.error('❌ Erreur dans getActiveBadges:', error);
      throw error;
    }
  }

  /**
   * Récupère les badges autorisés pour un budget
   */
  static async getBadgesByBudget(budgetId: string): Promise<Badge[]> {
    try {
      console.log('🔍 Récupération des badges pour le budget:', budgetId);

      const { data: budgetBadges, error } = await supabase
        .from('budget_badges')
        .select(`
          badge_id,
          badge:badges(*)
        `)
        .eq('budget_id', budgetId);

      if (error) {
        console.error('❌ Erreur lors de la récupération des badges du budget:', error);
        throw new Error(`Erreur lors de la récupération des badges: ${error.message}`);
      }

      const badges = budgetBadges?.map((bb: any) => bb.badge).filter(Boolean) || [];
      console.log('✅ Badges du budget récupérés:', badges.length);
      return badges;
    } catch (error) {
      console.error('❌ Erreur dans getBadgesByBudget:', error);
      throw error;
    }
  }

  /**
   * Récupère les badges assignés à un fichier
   */
  static async getBadgesByFile(fileId: string): Promise<FileBadge[]> {
    try {
      const { data: fileBadges, error } = await supabase
        .from('file_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('file_id', fileId);

      if (error) {
        throw new Error(`Erreur lors de la récupération des badges du fichier: ${error.message}`);
      }

      return fileBadges || [];
    } catch (error) {
      console.error('❌ Erreur dans getBadgesByFile:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau badge
   */
  static async createBadge(
    companyId: string, 
    userId: string, 
    badgeData: CreateBadgeForm
  ): Promise<Badge> {
    try {
      const { data: badge, error } = await supabase
        .from('badges')
        .insert({
          company_id: companyId,
          created_by: userId,
          ...badgeData
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la création du badge: ${error.message}`);
      }

      console.log('✅ Badge créé avec succès:', badge.name);
      return badge;
    } catch (error) {
      console.error('❌ Erreur dans createBadge:', error);
      throw error;
    }
  }

  /**
   * Met à jour un badge
   */
  static async updateBadge(badgeId: string, updates: UpdateBadgeForm): Promise<void> {
    try {
      const { error } = await supabase
        .from('badges')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', badgeId);

      if (error) {
        throw new Error(`Erreur lors de la mise à jour du badge: ${error.message}`);
      }

      console.log('✅ Badge mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur dans updateBadge:', error);
      throw error;
    }
  }

  /**
   * Archive un badge (soft delete)
   */
  static async archiveBadge(badgeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('badges')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', badgeId);

      if (error) {
        throw new Error(`Erreur lors de l'archivage du badge: ${error.message}`);
      }

      console.log('✅ Badge archivé avec succès');
    } catch (error) {
      console.error('❌ Erreur dans archiveBadge:', error);
      throw error;
    }
  }

  /**
   * Supprime définitivement un badge
   */
  static async deleteBadge(badgeId: string): Promise<void> {
    try {
      // Supprimer d'abord les relations
      await supabase.from('file_badges').delete().eq('badge_id', badgeId);
      await supabase.from('budget_badges').delete().eq('badge_id', badgeId);

      // Puis supprimer le badge
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', badgeId);

      if (error) {
        throw new Error(`Erreur lors de la suppression du badge: ${error.message}`);
      }

      console.log('✅ Badge supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur dans deleteBadge:', error);
      throw error;
    }
  }

  /**
   * Assigne des badges à un fichier avec support pour assignations multiples et pourcentages
   */
  static async assignBadgesToFile(
    fileId: string,
    badgeAssignments: { badgeId: string; amountAllocated?: number; percentage?: number }[],
    userId: string
  ): Promise<void> {
    try {
      console.log('🔍 BadgeService - Vérification des assignations existantes pour le fichier:', fileId);

      // Récupérer les assignations existantes
      const { data: existingAssignments, error: fetchError } = await supabase
        .from('file_badges')
        .select('badge_id, amount_allocated')
        .eq('file_id', fileId);

      if (fetchError) {
        throw new Error(`Erreur lors de la récupération des assignations existantes: ${fetchError.message}`);
      }

      // Comparer les assignations existantes avec les nouvelles
      const existing = existingAssignments || [];
      const newAssignments = badgeAssignments || [];

      // Vérifier les doublons dans les nouvelles assignations
      const badgeIdCounts = new Map();
      for (const assignment of newAssignments) {
        const count = badgeIdCounts.get(assignment.badgeId) || 0;
        badgeIdCounts.set(assignment.badgeId, count + 1);
        if (count >= 1) {
          throw new Error(`Erreur: Le badge avec l'ID ${assignment.badgeId} est assigné plusieurs fois à cette facture. Chaque badge ne peut être assigné qu'une seule fois par facture.`);
        }
      }

      // Créer des maps pour faciliter la comparaison
      const existingMap = new Map(existing.map(e => [e.badge_id, e.amount_allocated]));
      const newMap = new Map(newAssignments.map(n => [n.badgeId, n.amountAllocated]));

      // Vérifier si les assignations ont changé
      const hasChanged =
        existing.length !== newAssignments.length ||
        existing.some(e => !newMap.has(e.badge_id) || newMap.get(e.badge_id) !== e.amount_allocated) ||
        newAssignments.some(n => !existingMap.has(n.badgeId) || existingMap.get(n.badgeId) !== n.amountAllocated);

      if (!hasChanged) {
        console.log('ℹ️ BadgeService - Aucun changement détecté dans les assignations, aucune mise à jour nécessaire');
        return;
      }

      console.log('🔄 BadgeService - Changements détectés, mise à jour des assignations');
      console.log('📊 Assignations existantes:', existing);
      console.log('📊 Nouvelles assignations:', newAssignments);

      // Identifier tous les budgets qui pourraient être affectés (anciens et nouveaux badges)
      const allAffectedBadgeIds = [
        ...new Set([
          ...existing.map(e => e.badge_id),
          ...newAssignments.map(n => n.badgeId)
        ])
      ];

      // Supprimer les assignations existantes
      await supabase
        .from('file_badges')
        .delete()
        .eq('file_id', fileId);

      // Ajouter les nouvelles assignations
      if (badgeAssignments.length > 0) {
        const { error } = await supabase
          .from('file_badges')
          .insert(
            badgeAssignments.map(assignment => ({
              file_id: fileId,
              badge_id: assignment.badgeId,
              amount_allocated: assignment.amountAllocated,
              created_by: userId
            }))
          );

        if (error) {
          throw new Error(`Erreur lors de l'assignation des badges: ${error.message}`);
        }
      }

      // Recalculer le montant dépensé pour tous les budgets affectés
      if (allAffectedBadgeIds.length > 0) {
        console.log('🔄 BadgeService - Recalcul des budgets affectés par les changements');
        
        // Récupérer tous les budgets qui utilisent ces badges (anciens et nouveaux)
        const { data: affectedBudgets, error: budgetsError } = await supabase
          .from('budget_badges')
          .select('budget_id')
          .in('badge_id', allAffectedBadgeIds);

        if (!budgetsError && affectedBudgets) {
          const uniqueBudgetIds = [...new Set(affectedBudgets.map(bb => bb.budget_id))];
          
          console.log('📊 BadgeService - Budgets à recalculer:', uniqueBudgetIds.length);
          
          // Recalculer le montant dépensé pour chaque budget affecté
          for (const budgetId of uniqueBudgetIds) {
            await this.recalculateBudgetSpentAmount(budgetId);
          }
        }
      }

      console.log('✅ Badges assignés au fichier avec succès');
    } catch (error) {
      console.error('❌ Erreur dans assignBadgesToFile:', error);
      throw error;
    }
  }

  /**
   * Assigne des badges multiples à un fichier avec répartition par pourcentage et budgets
   * Nouvelle méthode pour le système d'assignation avancé
   */
  static async assignMultipleBudgetsBadgesToFile(
    fileId: string,
    multiAssignments: {
      budgetId: string;
      badgeId: string;
      percentage: number;
      amount: number;
    }[],
    userId: string
  ): Promise<void> {
    try {
      console.log('🔄 BadgeService - Assignation multiple avancée pour le fichier:', fileId);
      console.log('📊 Assignations à traiter:', multiAssignments);

      // Validation : vérifier que les pourcentages ne dépassent pas 100%
      const totalPercentage = multiAssignments.reduce((sum, assignment) => sum + assignment.percentage, 0);
      if (totalPercentage > 100) {
        throw new Error(`Le pourcentage total (${totalPercentage}%) dépasse 100%`);
      }

      // Vérifier les doublons dans les nouvelles assignations
      const badgeIdCounts = new Map();
      for (const assignment of multiAssignments) {
        const count = badgeIdCounts.get(assignment.badgeId) || 0;
        badgeIdCounts.set(assignment.badgeId, count + 1);
        if (count >= 1) {
          throw new Error(`Erreur: Le badge avec l'ID ${assignment.badgeId} est assigné plusieurs fois à cette facture. Chaque badge ne peut être assigné qu'une seule fois par facture.`);
        }
      }

      // Récupérer les assignations existantes pour nettoyage
      const { data: existingAssignments, error: fetchError } = await supabase
        .from('file_badges')
        .select('badge_id')
        .eq('file_id', fileId);

      if (fetchError) {
        throw new Error(`Erreur lors de la récupération des assignations existantes: ${fetchError.message}`);
      }

      const existing = existingAssignments || [];
      console.log('🔍 Assignations existantes trouvées:', existing.length);

      // Identifier tous les budgets qui pourraient être affectés
      const allAffectedBadgeIds = [
        ...new Set([
          ...existing.map(e => e.badge_id),
          ...multiAssignments.map(a => a.badgeId)
        ])
      ];

      // Supprimer toutes les assignations existantes
      await supabase
        .from('file_badges')
        .delete()
        .eq('file_id', fileId);

      console.log('🗑️ Assignations existantes supprimées');

      // Créer les nouvelles assignations si il y en a
      if (multiAssignments.length > 0) {
        const newAssignments = multiAssignments.map(assignment => ({
          file_id: fileId,
          badge_id: assignment.badgeId,
          amount_allocated: assignment.amount,
          percentage_allocated: assignment.percentage,
          created_by: userId
        }));

        const { error: insertError } = await supabase
          .from('file_badges')
          .insert(newAssignments);

        if (insertError) {
          throw new Error(`Erreur lors de l'insertion des nouvelles assignations: ${insertError.message}`);
        }

        console.log('✅ Nouvelles assignations multiples créées:', newAssignments.length);
      }

      // Mettre à jour les badge_ids dans la table files pour compatibilité
      const badgeIds = multiAssignments.map(a => a.badgeId);
      const { error: updateFileError } = await supabase
        .from('files')
        .update({ 
          badge_ids: badgeIds,
          // Mettre le budget_id avec le premier budget ou null si aucun
          budget_id: multiAssignments.length > 0 ? multiAssignments[0].budgetId : null
        })
        .eq('id', fileId);

      if (updateFileError) {
        console.warn('⚠️ Erreur lors de la mise à jour des badge_ids dans files:', updateFileError.message);
      }

      // Recalculer les montants dépensés pour tous les budgets affectés
      if (allAffectedBadgeIds.length > 0) {
        console.log('🔄 Recalcul des budgets affectés par les assignations multiples');
        
        // Récupérer tous les budgets qui utilisent ces badges
        const { data: affectedBudgets, error: budgetsError } = await supabase
          .from('budget_badges')
          .select('budget_id')
          .in('badge_id', allAffectedBadgeIds);

        if (!budgetsError && affectedBudgets) {
          const uniqueBudgetIds = [...new Set(affectedBudgets.map(bb => bb.budget_id))];
          
          console.log('📊 Budgets à recalculer:', uniqueBudgetIds.length);
          
          // Recalculer le montant dépensé pour chaque budget affecté
          for (const budgetId of uniqueBudgetIds) {
            await this.recalculateBudgetSpentAmount(budgetId);
          }
        }
      }

      console.log('✅ Assignation multiple terminée avec succès');
    } catch (error) {
      console.error('❌ Erreur dans assignMultipleBudgetsBadgesToFile:', error);
      throw error;
    }
  }

  /**
   * Recalcule le montant dépensé d'un budget basé sur les badges assignés
   */
  static async recalculateBudgetSpentAmount(budgetId: string): Promise<void> {
    try {
      console.log('🔄 Recalcul du montant dépensé pour le budget:', budgetId);

      // Récupérer le montant initial du budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('initial_amount')
        .eq('id', budgetId)
        .single();

      if (budgetError) {
        throw new Error(`Erreur lors de la récupération du budget: ${budgetError.message}`);
      }

      const initialAmount = budgetData?.initial_amount ?? 0;

      // Récupérer tous les file_badges qui correspondent aux badges de ce budget
      const { data: budgetBadges, error: budgetBadgesError } = await supabase
        .from('budget_badges')
        .select('badge_id')
        .eq('budget_id', budgetId);

      if (budgetBadgesError) {
        throw new Error(`Erreur lors de la récupération des badges du budget: ${budgetBadgesError.message}`);
      }

      if (!budgetBadges || budgetBadges.length === 0) {
        // Aucun badge assigné au budget, montant dépensé = 0
        await supabase
          .from('budgets')
          .update({
            spent_amount: 0
          })
          .eq('id', budgetId);
        
        console.log('✅ Montant dépensé mis à jour à 0 (aucun badge)');
        return;
      }

      const badgeIds = budgetBadges.map(bb => bb.badge_id);

      // Calculer la somme des montants alloués pour ces badges
      // IMPORTANT: Filtrer aussi par budget_id pour ne compter que les factures de ce budget
      const { data: fileBadges, error: fileBadgesError } = await supabase
        .from('file_badges')
        .select(`
          amount_allocated,
          file:files!inner(amount, budget_id)
        `)
        .in('badge_id', badgeIds)
        .eq('file.budget_id', budgetId)
        .not('file.budget_id', 'is', null);

      if (fileBadgesError) {
        throw new Error(`Erreur lors du calcul des montants: ${fileBadgesError.message}`);
      }

      // Calculer le total des montants alloués (sans doublons)
      const totalSpent = fileBadges?.reduce((sum, fb) => {
        // Utiliser amount_allocated si disponible, sinon le montant total du fichier
        const amount = fb.amount_allocated || fb.file?.amount || 0;
        return sum + amount;
      }, 0) || 0;

      // Mettre à jour le montant dépensé du budget
      // Note: remaining_amount est probablement une colonne calculée, on ne la met pas à jour directement
      const { error: updateError } = await supabase
        .from('budgets')
        .update({
          spent_amount: totalSpent
        })
        .eq('id', budgetId);

      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour du montant dépensé: ${updateError.message}`);
      }

      console.log('✅ Montant dépensé recalculé:', {
        budgetId,
        initialAmount,
        totalSpent,
        calculatedRemaining: initialAmount - totalSpent,
        badgeIds,
        fileBadgesCount: fileBadges?.length || 0,
        fileBadgesDetails: fileBadges?.map(fb => ({
          amount_allocated: fb.amount_allocated,
          file_amount: fb.file?.amount,
          file_budget_id: fb.file?.budget_id
        }))
      });
    } catch (error) {
      console.error('❌ Erreur lors du recalcul du montant dépensé:', error);
      throw error;
    }
  }

  /**
   * Met à jour les badges autorisés pour un budget
   */
  static async updateBudgetBadges(
    budgetId: string, 
    badgeIds: string[], 
    userId: string
  ): Promise<void> {
    try {
      // Supprimer les relations existantes
      await supabase
        .from('budget_badges')
        .delete()
        .eq('budget_id', budgetId);

      // Ajouter les nouvelles relations
      if (badgeIds.length > 0) {
        const { error } = await supabase
          .from('budget_badges')
          .insert(
            badgeIds.map(badgeId => ({
              budget_id: budgetId,
              badge_id: badgeId,
              created_by: userId
            }))
          );

        if (error) {
          throw new Error(`Erreur lors de la mise à jour des badges du budget: ${error.message}`);
        }
      }

      console.log('✅ Badges du budget mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur dans updateBudgetBadges:', error);
      throw error;
    }
  }

  /**
   * Génère une analyse détaillée des badges
   */
  static async getBadgeAnalysis(
    companyId: string,
    budgetId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<BadgeAnalysis[]> {
    try {
      let query = supabase
        .from('file_badges')
        .select(`
          *,
          badge:badges(*),
          file:files(id, name, amount, document_date, url, budget_id)
        `);

      // Filtrer par entreprise via les badges
      query = query.eq('badge.company_id', companyId);

      // Filtrer par budget si spécifié
      if (budgetId) {
        query = query.eq('file.budget_id', budgetId);
      }

      const { data: fileBadges, error } = await query;

      if (error) {
        throw new Error(`Erreur lors de l'analyse des badges: ${error.message}`);
      }

      // Grouper par badge et calculer les statistiques
      const badgeMap = new Map<string, BadgeAnalysis>();

      fileBadges?.forEach((fb: any) => {
        if (!fb.badge || !fb.file) return;

        const badgeId = fb.badge.id;
        const amount = fb.amount_allocated || fb.file.amount || 0;

        if (!badgeMap.has(badgeId)) {
          badgeMap.set(badgeId, {
            badge: fb.badge,
            total_amount: 0,
            files_count: 0,
            percentage_of_budget: 0,
            files: []
          });
        }

        const analysis = badgeMap.get(badgeId)!;
        analysis.total_amount += amount;
        analysis.files_count++;
        analysis.files.push({
          id: fb.file.id,
          name: fb.file.name,
          amount: amount,
          document_date: fb.file.document_date,
          url: fb.file.url
        });
      });

      const analyses = Array.from(badgeMap.values());
      
      // Calculer les pourcentages
      const totalAmount = analyses.reduce((sum, a) => sum + a.total_amount, 0);
      analyses.forEach(analysis => {
        analysis.percentage_of_budget = totalAmount > 0 
          ? Math.round((analysis.total_amount / totalAmount) * 100 * 100) / 100 
          : 0;
      });

      return analyses.sort((a, b) => b.total_amount - a.total_amount);
    } catch (error) {
      console.error('❌ Erreur dans getBadgeAnalysis:', error);
      throw error;
    }
  }

  /**
   * Récupère un badge par ID
   */
  static async getBadgeById(badgeId: string): Promise<Badge | null> {
    try {
      const { data: badge, error } = await supabase
        .from('badges')
        .select('*')
        .eq('id', badgeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Erreur lors de la récupération du badge: ${error.message}`);
      }

      return badge;
    } catch (error) {
      console.error('❌ Erreur dans getBadgeById:', error);
      throw error;
    }
  }

  /**
   * Désassigne une facture spécifique d'un badge spécifique
   */
  static async unassignFileFromBadge(fileId: string, badgeId: string): Promise<void> {
    try {
      console.log('🔄 BadgeService - Désassignation de la facture:', fileId, 'du badge:', badgeId);

      // Récupérer l'assignation existante pour vérifier qu'elle existe
      const { data: existingAssignment, error: fetchError } = await supabase
        .from('file_badges')
        .select('*')
        .eq('file_id', fileId)
        .eq('badge_id', badgeId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Cette facture n\'est pas assignée à ce badge');
        }
        throw new Error(`Erreur lors de la récupération de l'assignation: ${fetchError.message}`);
      }

      // Supprimer l'assignation
      const { error: deleteError } = await supabase
        .from('file_badges')
        .delete()
        .eq('file_id', fileId)
        .eq('badge_id', badgeId);

      if (deleteError) {
        throw new Error(`Erreur lors de la désassignation: ${deleteError.message}`);
      }

      // Récupérer le budget affecté pour le recalcul
      const { data: budgetBadge, error: budgetError } = await supabase
        .from('budget_badges')
        .select('budget_id')
        .eq('badge_id', badgeId)
        .single();

      if (!budgetError && budgetBadge) {
        // Recalculer le montant dépensé du budget
        await this.recalculateBudgetSpentAmount(budgetBadge.budget_id);
      }

      console.log('✅ Facture désassignée avec succès du badge');
    } catch (error) {
      console.error('❌ Erreur dans unassignFileFromBadge:', error);
      throw error;
    }
  }
}
