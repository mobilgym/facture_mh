import React, { useState, useEffect } from 'react';
import { Search, Calendar, EuroIcon, Filter, X, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface SearchFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  amountExact: string;
  dateMode: 'before' | 'after' | 'between' | 'exact' | 'year' | 'month' | 'quarter' | '';
  amountMode: 'exact' | 'greater' | 'less' | 'between' | '';
  year?: string;
  month?: string;
  quarter?: string;
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onToggleSelection?: () => void;
  selectionMode?: boolean;
  selectedCount?: number;
}

export default function AdvancedSearch({
  onFiltersChange,
  onToggleSelection,
  selectionMode = false,
  selectedCount = 0
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    amountExact: '',
    dateMode: '',
    amountMode: '',
    year: '',
    month: '',
    quarter: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    const emptyFilters: SearchFilters = {
      search: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      amountExact: '',
      dateMode: '',
      amountMode: '',
      year: '',
      month: '',
      quarter: ''
    };
    setFilters(emptyFilters);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      {/* Barre de recherche principale */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Recherche textuelle */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-3 ${showAdvanced ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'} transition-all duration-200`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres avancés
          </Button>

          {hasActiveFilters() && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="px-4 py-3 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
              title="Réinitialiser les filtres"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}

          <Button
            variant={selectionMode ? "primary" : "ghost"}
            onClick={onToggleSelection}
            className="px-4 py-3 transition-all duration-200"
          >
            {selectionMode ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Annuler ({selectedCount})
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Sélection multiple
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filtres de date */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700">Filtres par date</h3>
              </div>

              <div className="space-y-3">
                <select
                  value={filters.dateMode}
                  onChange={(e) => handleFilterChange('dateMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Sélectionner un mode</option>
                  <option value="exact">Date exacte</option>
                  <option value="before">Avant le</option>
                  <option value="after">Après le</option>
                  <option value="between">Entre deux dates</option>
                  <option value="year">Année complète</option>
                  <option value="month">Mois spécifique</option>
                  <option value="quarter">Trimestre</option>
                </select>

                {filters.dateMode === 'exact' && (
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                )}

                {(filters.dateMode === 'before' || filters.dateMode === 'after') && (
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={filters.dateMode === 'before' ? 'Avant le...' : 'Après le...'}
                  />
                )}

                {filters.dateMode === 'between' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Date de début"
                    />
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Date de fin"
                    />
                  </div>
                )}

                {filters.dateMode === 'year' && (
                  <select
                    value={filters.year || ''}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Sélectionner une année</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                )}

                {filters.dateMode === 'month' && (
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={filters.year || ''}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Année</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    <select
                      value={filters.month || ''}
                      onChange={(e) => handleFilterChange('month', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Mois</option>
                      <option value="01">Janvier</option>
                      <option value="02">Février</option>
                      <option value="03">Mars</option>
                      <option value="04">Avril</option>
                      <option value="05">Mai</option>
                      <option value="06">Juin</option>
                      <option value="07">Juillet</option>
                      <option value="08">Août</option>
                      <option value="09">Septembre</option>
                      <option value="10">Octobre</option>
                      <option value="11">Novembre</option>
                      <option value="12">Décembre</option>
                    </select>
                  </div>
                )}

                {filters.dateMode === 'quarter' && (
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={filters.year || ''}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Année</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    <select
                      value={filters.quarter || ''}
                      onChange={(e) => handleFilterChange('quarter', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Trimestre</option>
                      <option value="Q1">T1 (Jan-Mar)</option>
                      <option value="Q2">T2 (Avr-Juin)</option>
                      <option value="Q3">T3 (Juil-Sep)</option>
                      <option value="Q4">T4 (Oct-Déc)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Filtres de montant */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <EuroIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700">Filtres par montant</h3>
              </div>

              <div className="space-y-3">
                <select
                  value={filters.amountMode}
                  onChange={(e) => handleFilterChange('amountMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Sélectionner un mode</option>
                  <option value="exact">Montant exact</option>
                  <option value="greater">Supérieur à</option>
                  <option value="less">Inférieur à</option>
                  <option value="between">Entre deux montants</option>
                </select>

                {filters.amountMode === 'exact' && (
                  <input
                    type="number"
                    step="0.01"
                    value={filters.amountExact}
                    onChange={(e) => handleFilterChange('amountExact', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Montant exact..."
                  />
                )}

                {(filters.amountMode === 'greater' || filters.amountMode === 'less') && (
                  <input
                    type="number"
                    step="0.01"
                    value={filters.amountMin}
                    onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={filters.amountMode === 'greater' ? 'Supérieur à...' : 'Inférieur à...'}
                  />
                )}

                {filters.amountMode === 'between' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.01"
                      value={filters.amountMin}
                      onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Montant min"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={filters.amountMax}
                      onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Montant max"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
