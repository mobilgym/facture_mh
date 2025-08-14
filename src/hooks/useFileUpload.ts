import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { uploadFile } from '@/lib/services/uploadService';
import { UploadError } from '@/lib/errors/upload';

export function useFileUpload(folderId: string | null = null) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const { selectedCompany } = useCompany();

  const upload = async (file: File, fileName: string, date: Date, amount: number | null) => {
    if (!user) {
      throw new UploadError('Utilisateur non authentifié');
    }

    if (!selectedCompany) {
      throw new UploadError('Aucune société sélectionnée');
    }

    setUploading(true);
    setProgress(0);

    try {
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      const result = await uploadFile({
        file,
        fileName,
        date,
        year,
        month,
        amount,
        user,
        company: selectedCompany,
        folderId,
        onProgress: (p) => setProgress(p)
      });

      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { upload, uploading, progress };
}