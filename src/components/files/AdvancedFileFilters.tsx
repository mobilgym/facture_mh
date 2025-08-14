import React from 'react';
import { Filter, X } from 'lucide-react';
import { useAdvancedFileFilters } from '@/hooks/useAdvancedFileFilters';
import Button from '@/components/ui/Button';
import type { AdvancedFileFilter } from '@/types/file';

interface AdvancedFileFiltersProps {
  onFilterChange: (filters: AdvancedFileFilter) => void;
}

export default function AdvancedFileFilters({ onFilterChange }: AdvancedFileFiltersProps) {
  const { filters, updateFilter, resetFilters } = useAdvancedFileFilters();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleFilterChange = (key: keyof AdvancedFileFilter, value: any) => {
    updateFilter(key, value);
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtres avancés
      </Button>

      {isOpen && (
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type de fichier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de fichier
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tous</option>
                <option value="application/pdf">PDF</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
              </select>
            </div>

            {/* Taille */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taille
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min (Ko)"
                  value={filters.size?.min || ''}
                  onChange={(e) => handleFilterChange('size', {
                    ...filters.size,
                    min: e.target.value ? parseInt(e.target.value) * 1024 : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max (Ko)"
                  value={filters.size?.max || ''}
                  onChange={(e) => handleFilterChange('size', {
                    ...filters.size,
                    max: e.target.value ? parseInt(e.target.value) * 1024 : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Plage de dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de création
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value ? new Date(e.target.value) : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <span>-</span>
                <input
                  type="date"
                  value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value ? new Date(e.target.value) : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {filters.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleFilterChange('tags', filters.tags.filter(t => t !== tag))}
                      className="ml-1 p-0.5 hover:bg-blue-100 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Ajouter un tag..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !filters.tags.includes(value)) {
                        handleFilterChange('tags', [...filters.tags, value]);
                        input.value = '';
                      }
                    }
                  }}
                  className="flex-1 min-w-[150px] px-3 py-1 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetFilters();
                onFilterChange({
                  search: '',
                  date: null,
                  type: null,
                  size: null,
                  tags: [],
                  createdBy: null,
                  dateRange: { start: null, end: null }
                });
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}