import { UploadError } from '../errors/uploadError';

// Map MIME types to friendly names
const FILE_TYPE_NAMES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX'
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = new Set(Object.keys(FILE_TYPE_NAMES));
const MIN_FILE_SIZE = 1; // 1 byte minimum

export function validateFileSize(file: File): void {
  if (!file) {
    throw new UploadError('Aucun fichier sélectionné', 'NO_FILE_SELECTED');
  }

  if (!file.size || file.size < MIN_FILE_SIZE) {
    throw new UploadError(
      'Le fichier est vide ou corrompu',
      'EMPTY_FILE'
    );
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(
      `Le fichier est trop volumineux (maximum ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      'FILE_TOO_LARGE'
    );
  }
}

export function validateFileType(file: File): void {
  if (!file.type) {
    throw new UploadError(
      'Type de fichier non reconnu',
      'UNKNOWN_FILE_TYPE'
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    const allowedTypes = Object.values(FILE_TYPE_NAMES).join(', ');
    throw new UploadError(
      `Type de fichier non supporté. Types acceptés : ${allowedTypes}`,
      'INVALID_FILE_TYPE'
    );
  }
}

export function validateFileName(fileName: string): void {
  if (!fileName?.trim()) {
    throw new UploadError('Le nom du fichier est requis', 'FILENAME_REQUIRED');
  }

  if (fileName.length > 255) {
    throw new UploadError('Le nom du fichier est trop long', 'FILENAME_TOO_LONG');
  }

  // Check for invalid characters
  if (/[<>:"/\\|?*]/.test(fileName)) {
    throw new UploadError(
      'Le nom du fichier contient des caractères non autorisés',
      'INVALID_FILENAME_CHARS'
    );
  }
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
}