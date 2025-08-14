import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function createYearMonthPath(date: Date): string {
  const year = format(date, 'yyyy');
  const month = format(date, 'MM'); // Utilisation du format numérique pour éviter les accents
  return `${year}/${month}`;
}

export function sanitizePath(path: string): string {
  return path
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-zA-Z0-9-_./]/g, '_'); // Remplace les caractères spéciaux par des underscores
}

export function getYearMonthFromPath(path: string): { year: string; month: string } | null {
  const parts = path.split('/');
  if (parts.length >= 2) {
    return {
      year: parts[0],
      month: parts[1]
    };
  }
  return null;
}