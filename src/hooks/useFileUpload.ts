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
    badgeIds?: string[]
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

      // Vérifier si c'est une image et la convertir en PDF si nécessaire
      if (isImageFile(file)) {
        console.log(`Conversion de l'image ${file.name} en PDF...`);
        setConverting(true);
        
        try {
          // Convertir l'image en PDF avec une qualité élevée (0.9)
          processedFile = await processFileForUpload(file, 0.9);
          
          // Mettre à jour le nom du fichier pour qu'il ait l'extension .pdf
          if (!processedFileName.toLowerCase().endsWith('.pdf')) {
            const nameWithoutExtension = processedFileName.replace(/\.[^/.]+$/, '');
            processedFileName = `${nameWithoutExtension}.pdf`;
          }
          
          console.log(`Image convertie avec succès: ${processedFile.name}`);
        } catch (conversionError) {
          console.error('Erreur lors de la conversion:', conversionError);
          throw new UploadError(
            `Impossible de convertir l'image en PDF: ${conversionError instanceof Error ? conversionError.message : 'Erreur inconnue'}`
          );
        } finally {
          setConverting(false);
        }
      }

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

      // Si des badges sont sélectionnés, les assigner au fichier uploadé
      if (result && badgeIds && badgeIds.length > 0 && amount) {
        console.log('🏷️ Assignation des badges au fichier uploadé:', badgeIds);
        
        // Calculer le montant par badge (répartition équitable)
        const amountPerBadge = amount / badgeIds.length;
        
        const badgeAssignments = badgeIds.map(badgeId => ({
          badgeId,
          amountAllocated: amountPerBadge
        }));

        await BadgeService.assignBadgesToFile(result.id, badgeAssignments, user.id);
        console.log('✅ Badges assignés avec succès au fichier uploadé');
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