import { format } from 'date-fns';

interface StoragePathOptions {
  companyId: string;
  date: Date;
  fileName: string;
  type?: 'invoice' | 'document';
}

export function createStoragePath({ companyId, date, fileName, type = 'document' }: StoragePathOptions): string {
  const year = date.getFullYear();
  const month = date.toLocaleString('fr-FR', { month: 'long' });
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Structure spécifique pour les factures
  if (type === 'invoice') {
    return `companies/${companyId}/factures/${year}/${month}/${timestamp}-${sanitizedFileName}`;
  }
  
  // Structure standard pour les autres documents
  return `companies/${companyId}/documents/${year}/${month}/${timestamp}-${sanitizedFileName}`;
}

export function getFileType(fileName: string): 'invoice' | 'document' {
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.includes('facture') || lowerFileName.includes('invoice')) {
    return 'invoice';
  }
  return 'document';
}