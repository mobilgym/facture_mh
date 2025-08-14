import { supabase } from '../supabase';
import { UploadError } from '../errors/uploadError';
import type { User } from '@supabase/supabase-js';
import type { Company } from '@/types/company';

interface FileMetadataInput {
  file: File;
  fileName: string;
  storagePath: string;
  publicUrl: string;
  user: User;
  company: Company;
  folderId: string | null;
  date: Date;
}

interface FileMetadata {
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
  folder_id: string | null;
  company_id: string;
  created_by: string;
  document_date: string; // Changed to string for ISO format
}

export function createFileMetadata({
  file,
  fileName,
  storagePath,
  publicUrl,
  user,
  company,
  folderId,
  date
}: FileMetadataInput): FileMetadata {
  return {
    name: fileName,
    type: file.type,
    size: file.size,
    url: publicUrl,
    path: storagePath,
    folder_id: folderId,
    company_id: company.id,
    created_by: user.id,
    document_date: date.toISOString() // Convert to ISO string
  };
}

export async function saveFileMetadata(metadata: FileMetadata): Promise<void> {
  try {
    const { error } = await supabase
      .from('files')
      .insert(metadata);

    if (error) {
      console.error('Database insert error:', error);
      throw new UploadError(
        'Erreur lors de l\'enregistrement des métadonnées',
        'METADATA_SAVE_ERROR',
        error
      );
    }
  } catch (error) {
    console.error('Error saving file metadata:', error);
    throw UploadError.fromError(error);
  }
}