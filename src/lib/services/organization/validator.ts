import { isValid, parseISO } from 'date-fns';

export function validateDate(date: Date | string | null): Date | null {
  if (!date) return null;
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) ? parsedDate : null;
}

export function validateFilePath(path: string): boolean {
  if (!path) return false;
  
  // Check for invalid characters
  if (/[<>:"|?*]/.test(path)) return false;
  
  // Check path structure
  const parts = path.split('/');
  if (parts.length < 3) return false; // Should have year/month/filename
  
  // Validate year
  const year = parseInt(parts[0]);
  if (isNaN(year) || year < 1900 || year > 9999) return false;
  
  // Validate month
  const month = parseInt(parts[1]);
  if (isNaN(month) || month < 1 || month > 12) return false;
  
  // Validate filename
  const filename = parts[parts.length - 1];
  if (!filename || filename.length > 255) return false;
  
  return true;
}