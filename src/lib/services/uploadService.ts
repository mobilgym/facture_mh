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
  onProgress
}: UploadOptions): Promise<string> {
  try {
    // Valider les entrées
    validateFileSize(file);
    validateFileType(file);
    validateFileName(fileName);

    // Convertir en PDF si nécessaire
    const fileToUpload = await convertToPdf(file);
    const pdfFileName = fileName.replace(/\.[^/.]+$/, '.pdf');

    // Créer le chemin de stockage
    const yearMonthPath = createYearMonthPath(date);
    const sanitizedName = sanitizePath(`${company.id}/${yearMonthPath}/${Date.now()}-${pdfFileName}`);

    // Upload vers le storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('test')
      .upload(sanitizedName, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new UploadError('Erreur lors du téléchargement', 'UPLOAD_FAILED');
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('test')
      .getPublicUrl(uploadData.path);

    if (!urlData?.publicUrl) {
      throw new UploadError('URL du fichier non disponible', 'URL_GENERATION_FAILED');
    }

    // Sauvegarder les métadonnées
    const { error: metadataError } = await supabase
      .from('files')
      .insert({
        name: pdfFileName,
        type: 'application/pdf',
        size: fileToUpload.size,
        url: urlData.publicUrl,
        path: uploadData.path,
        folder_id: folderId,
        company_id: company.id,
        created_by: user.id,
        document_date: date.toISOString(),
        year,
        month,
        amount
      });

    if (metadataError) {
      throw new UploadError('Erreur lors de l\'enregistrement des métadonnées', 'METADATA_ERROR');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof UploadError ? error : new UploadError('Une erreur inattendue est survenue');
  }
}