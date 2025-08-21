import { supabase } from '@/lib/supabase';
import { BadgeService } from './badgeService';
import type { FileItem } from '@/types/file';

/**
 * Service pour mettre à jour les métadonnées d'un fichier
 */
export async function updateFileMetadata(
  fileId: string, 
  updates: Partial<Pick<FileItem, 'amount' | 'name' | 'document_date' | 'year' | 'month'>>
): Promise<void> {
  try {
    console.log('Updating file metadata:', fileId, updates);
    
    const { error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', fileId);

    if (error) {
      console.error('Error updating file metadata:', error);
      throw new Error(`Erreur lors de la mise à jour du fichier: ${error.message}`);
    }

    console.log('File metadata updated successfully');
  } catch (error) {
    console.error('File update service error:', error);
    throw error;
  }
}

/**
 * Service pour mettre à jour un fichier avec ses badges et budget
 */
export async function updateFileWithBadges(
  fileId: string, 
  updates: Partial<FileItem>,
  userId: string
): Promise<void> {
  try {
    console.log('🔄 updateFileWithBadges - Début de la mise à jour:', fileId, updates);
    
    // Séparer les mises à jour des métadonnées et des badges
    const { badge_ids, budget_id, ...metadataUpdates } = updates;
    
    // 1. Mettre à jour les métadonnées de base du fichier (incluant budget_id et badge_ids si fournis)
    const fileUpdates = { ...metadataUpdates };
    if (budget_id !== undefined) {
      fileUpdates.budget_id = budget_id;
    }
    if (badge_ids !== undefined) {
      fileUpdates.badge_ids = badge_ids;
    }

    if (Object.keys(fileUpdates).length > 0) {
      console.log('📝 Mise à jour des métadonnées, budget et badge_ids:', fileUpdates);
      const { error: metadataError } = await supabase
        .from('files')
        .update(fileUpdates)
        .eq('id', fileId);

      if (metadataError) {
        throw new Error(`Erreur lors de la mise à jour des métadonnées: ${metadataError.message}`);
      }
    }

    // 2. Gérer l'assignation des badges si badge_ids est fourni
    if (badge_ids !== undefined) {
      console.log('🏷️ Gestion des badges:', badge_ids);
      
      if (badge_ids === null || badge_ids.length === 0) {
        // Supprimer toutes les assignations de badges
        console.log('🗑️ Suppression des assignations de badges');
        await BadgeService.assignBadgesToFile(fileId, [], userId);
      } else {
        // Récupérer le montant du fichier pour répartition
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .select('amount')
          .eq('id', fileId)
          .single();

        if (fileError) {
          throw new Error(`Erreur lors de la récupération du fichier: ${fileError.message}`);
        }

        const fileAmount = fileData.amount || 0;
        const amountPerBadge = badge_ids.length > 0 ? fileAmount / badge_ids.length : 0;

        console.log(`💰 Répartition du montant: ${fileAmount}€ / ${badge_ids.length} badges = ${amountPerBadge}€ par badge`);

        // Créer les assignations de badges avec répartition équitable
        const badgeAssignments = badge_ids.map(badgeId => ({
          badgeId,
          amountAllocated: amountPerBadge
        }));

        await BadgeService.assignBadgesToFile(fileId, badgeAssignments, userId);
        console.log('✅ Badges assignés avec succès');
      }
    }

    console.log('✅ updateFileWithBadges - Mise à jour terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur dans updateFileWithBadges:', error);
    throw error;
  }
}

/**
 * Service pour récupérer les informations d'un fichier
 */
export async function getFileById(fileId: string): Promise<FileItem | null> {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      console.error('Error fetching file:', error);
      throw new Error(`Erreur lors de la récupération du fichier: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('File fetch service error:', error);
    throw error;
  }
}