import { supabase } from '../supabase';
import { UploadError } from '../errors/uploadError';
import { validateFileSize, validateFileType, validateFileName } from '../validators/fileValidator';
import { createYearMonthPath, sanitizePath } from '../utils/path';
import type { User } from '@supabase/supabase-js';
import type { Company } from '@/types/company';

interface UploadOptions {
  file: File;
  fileName: string;
  date: Date;
  year: string;
  month: string;
  amount: number | null;
  user: User;
  company: Company;
  folderId: string | null;
  budgetId?: string | null;
  badgeIds?: string[];
  onProgress?: (progress: number) => void;
}

async function convertToPdf(file: File): Promise<Blob> {
  if (file.type === 'application/pdf') {
    return file;
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/convert-to-pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la conversion en PDF');
  }

  const data = await response.json();
  return new Blob([data.pdf], { type: 'application/pdf' });
}

export async function uploadFile({
  file,
  fileName,
  date,
  year,
  month,
  amount,
  user,
  company,
  folderId,
  budgetId,
  badgeIds,
  onProgress
}: UploadOptions): Promise<any> {
  try {
    // Déterminer si c'est une facture manuelle (fichier vide)
    const isManualInvoice = file.size === 0;
    
    if (!isManualInvoice) {
      // Validation normale pour les vrais fichiers
      validateFileSize(file);
      validateFileType(file);
    }
    validateFileName(fileName);

    let uploadData = null;
    let urlData = null;
    let fileToUpload = null;
    
    if (!isManualInvoice) {
      // Traitement normal pour les fichiers réels
      fileToUpload = await convertToPdf(file);
      const pdfFileName = fileName.replace(/\.[^/.]+$/, '.pdf');

      // Créer le chemin de stockage
      const yearMonthPath = createYearMonthPath(date);
      const sanitizedName = sanitizePath(`${company.id}/${yearMonthPath}/${Date.now()}-${pdfFileName}`);

      // Upload vers le storage
      const uploadResult = await supabase.storage
        .from('test')
        .upload(sanitizedName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadResult.error) {
        throw new UploadError('Erreur lors du téléchargement', 'UPLOAD_FAILED');
      }
      
      uploadData = uploadResult.data;

      // Obtenir l'URL publique
      const urlResult = supabase.storage
        .from('test')
        .getPublicUrl(uploadData.path);

      if (!urlResult?.data?.publicUrl) {
        throw new UploadError('URL du fichier non disponible', 'URL_GENERATION_FAILED');
      }
      
      urlData = urlResult.data;
    }

    // Préparation des données pour la base de données
    const finalFileName = fileName.replace(/\.[^/.]+$/, '.pdf');
    const insertData = {
      name: finalFileName,
      type: isManualInvoice ? 'manual/invoice' : 'application/pdf',
      size: isManualInvoice ? 0 : fileToUpload!.size,
      url: isManualInvoice ? null : urlData!.publicUrl,
      path: isManualInvoice ? null : uploadData!.path,
      folder_id: folderId,
      company_id: company.id,
      created_by: user.id,
      document_date: date.toISOString(),
      year,
      month,
      amount,
      budget_id: budgetId,
      badge_ids: badgeIds,
      is_manual: isManualInvoice
    };

    // Sauvegarder les métadonnées
    const { data: fileData, error: metadataError } = await supabase
      .from('files')
      .insert(insertData)
      .select()
      .single();

    if (metadataError) {
      throw new UploadError('Erreur lors de l\'enregistrement des métadonnées', 'METADATA_ERROR');
    }

    return fileData;
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof UploadError ? error : new UploadError('Une erreur inattendue est survenue');
  }
}