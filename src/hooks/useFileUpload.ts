import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { uploadFile } from '@/lib/services/uploadService';
import { UploadError } from '@/lib/errors/upload';
import { processFileForUpload, isImageFile } from '@/lib/utils/imageConverter';
import { BadgeService } from '@/lib/services/badgeService';

export function useFileUpload(folderId: string | null = null) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const { user } = useAuth();
  const { selectedCompany } = useCompany();

  const upload = async (
    file: File, 
    fileName: string, 
    date: Date, 
    amount: number | null, 
    budgetId?: string | null, 
    badgeIds?: string[],
    multiAssignments?: any[]
  ) => {
    if (!user) {
      throw new UploadError('Utilisateur non authentifié');
    }

    if (!selectedCompany) {
      throw new UploadError('Aucune société sélectionnée');
    }

    setUploading(true);
    setProgress(0);

    try {
      let processedFile = file;
      let processedFileName = fileName;

      // Le fichier est maintenant déjà prétraité en amont
      console.log(`Upload du fichier prétraité: ${file.name}`);

      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      const result = await uploadFile({
        file: processedFile,
        fileName: processedFileName,
        date,
        year,
        month,
        amount,
        user,
        company: selectedCompany,
        folderId,
        budgetId,
        badgeIds,
        onProgress: (p) => setProgress(p)
      });

      // Gérer les assignations selon le mode (simple ou multiple)
      if (result) {
        if (multiAssignments && multiAssignments.length > 0) {
          // Mode assignation multiple avec pourcentages
          console.log('🔄 Assignation multiple avec pourcentages:', result.id);
          
          const assignments = multiAssignments.map(assignment => ({
            budgetId: assignment.budgetId,
            badgeId: assignment.badgeId,
            percentage: assignment.percentage,
            amount: assignment.amount
          }));

          await BadgeService.assignMultipleBudgetsBadgesToFile(result.id, assignments, user.id);
          console.log('✅ Assignations multiples créées avec succès');
        } else if (badgeIds && badgeIds.length > 0 && amount) {
          // Mode simple avec répartition équitable
          console.log('🏷️ Assignation simple des badges au fichier uploadé:', badgeIds);
          
          const amountPerBadge = amount / badgeIds.length;
          
          const badgeAssignments = badgeIds.map(badgeId => ({
            badgeId,
            amountAllocated: amountPerBadge
          }));

          await BadgeService.assignBadgesToFile(result.id, badgeAssignments, user.id);
          console.log('✅ Badges assignés avec succès au fichier');
        }
      }

      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setUploading(false);
      setConverting(false);
      setProgress(0);
    }
  };

  return { upload, uploading, progress, converting };
}