import { useState, useCallback } from 'react';
import type { AdvancedFileFilter } from '@/types/file';

const defaultFilters: AdvancedFileFilter = {
  search: '',
  date: null,
  type: null,
  size: null,
  tags: [],
  createdBy: null,
  dateRange: {
    start: null,
    end: null
  }
};

export function useAdvancedFileFilters() {
  const [filters, setFilters] = useState<AdvancedFileFilter>(defaultFilters);

  const updateFilter = useCallback((key: keyof AdvancedFileFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const applyFilters = useCallback((files: any[]) => {
    return files.filter(file => {
      // Recherche textuelle
      if (filters.search && !file.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Type de fichier
      if (filters.type && file.type !== filters.type) {
        return false;
      }

      // Taille de fichier
      if (filters.size) {
        const { min, max } = filters.size;
        if (min && file.size < min) return false;
        if (max && file.size > max) return false;
      }

      // Tags
      if (filters.tags.length > 0) {
        const fileTags = file.tags || [];
        if (!filters.tags.every(tag => fileTags.includes(tag))) {
          return false;
        }
      }

      // Créateur
      if (filters.createdBy && file.createdBy !== filters.createdBy) {
        return false;
      }

      // Plage de dates
      if (filters.dateRange.start || filters.dateRange.end) {
        const fileDate = new Date(file.createdAt);
        if (filters.dateRange.start && fileDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && fileDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  return { filters, updateFilter, resetFilters, applyFilters };
}