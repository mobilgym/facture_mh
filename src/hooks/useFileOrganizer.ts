import { useState } from 'react';
import { organizeFile, organizeFiles } from '@/lib/services/organization/fileOrganizer';
import { validateDate } from '@/lib/services/organization/validator';
import type { OrganizedFile } from '@/lib/services/organization/types';

export function useFileOrganizer() {
  const [organizing, setOrganizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organizeOne = async (fileId: string, date: Date) => {
    try {
      setOrganizing(true);
      setError(null);
      
      const validDate = validateDate(date);
      if (!validDate) {
        throw new Error('Date invalide');
      }

      await organizeFile(fileId, validDate);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setOrganizing(false);
    }
  };

  const organizeBatch = async (files: OrganizedFile[]) => {
    try {
      setOrganizing(true);
      setError(null);
      await organizeFiles(files);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setOrganizing(false);
    }
  };

  return {
    organizing,
    error,
    organizeOne,
    organizeBatch
  };
}