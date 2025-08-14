import { format } from 'date-fns';

export function buildOrganizedPath(
  originalPath: string, 
  date: Date
): string {
  const pathParts = originalPath.split('/');
  const fileName = pathParts[pathParts.length - 1];
  
  // Use numeric month format to avoid accent issues
  const year = format(date, 'yyyy');
  const month = format(date, 'MM');
  
  return `${year}/${month}/${fileName}`;
}