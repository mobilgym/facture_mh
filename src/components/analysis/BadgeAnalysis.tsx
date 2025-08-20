import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, BarChart3, PieChart, Calendar, DollarSign, Tag } from 'lucide-react';
import { Badge as BadgeComponent } from '../badges/Badge';
import { useBadges } from '../../hooks/useBadges';
import { useBudgets } from '../../hooks/useBudgets';
import type { Badge, BadgeAnalysis as BadgeAnalysisType, BadgeFilter } from '../../types/badge';

export function BadgeAnalysis() {
  const [filters, setFilters] = useState<BadgeFilter>({
    budgetId: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: 0, max: 0 },
    search: ''
  });
  const [analysis, setAnalysis] = useState<BadgeAnalysisType[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const { generateAnalysis, activeBadges } = useBadges();
  const { budgets } = useBudgets();

  // Charger l'analyse
  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const analysisData = await generateAnalysis(
        filters.budgetId || undefined,
        filters.dateRange?.start || undefined,
        filters.dateRange?.end || undefined
      );
      
      // Appliquer les filtres côté client
      let filteredData = analysisData;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(item => 
          item.badge.name.toLowerCase().includes(searchLower) ||
          item.badge.description?.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.amountRange && (filters.amountRange.min > 0 || filters.amountRange.max > 0)) {
        filteredData = filteredData.filter(item => {
          if (filters.amountRange!.min > 0 && item.total_amount < filters.amountRange!.min) return false;
          if (filters.amountRange!.max > 0 && item.total_amount > filters.amountRange!.max) return false;
          return true;
        });
      }
      
      setAnalysis(filteredData);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'analyse:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger l'analyse au montage et quand les filtres changent
  useEffect(() => {
    loadAnalysis();
  }, [filters.budgetId, filters.dateRange, filters.amountRange]);

  // Recherche avec délai
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAnalysis();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const totalAmount = analysis.reduce((sum, item) => sum + item.total_amount, 0);
  const totalFiles = analysis.reduce((sum, item) => sum + item.files_count, 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analyse par Badges</h2>
          <p className="text-gray-600">Analysez vos dépenses par badges avec des filtres avancés</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <PieChart className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Nom du badge..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget
            </label>
            <select
              value={filters.budgetId}
              onChange={(e) => setFilters(prev => ({ ...prev, budgetId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les budgets</option>
              {budgets.map(budget => (
                <option key={budget.id} value={budget.id}>
                  {budget.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, start: e.target.value } 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, end: e.target.value } 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtres de montant */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant minimum
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.amountRange?.min || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  amountRange: { ...prev.amountRange, min: parseFloat(e.target.value) || 0 } 
                }))}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant maximum
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.amountRange?.max || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  amountRange: { ...prev.amountRange, max: parseFloat(e.target.value) || 0 } 
                }))}
                placeholder="Illimité"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total des dépenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Tag className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Badges utilisés</p>
              <p className="text-2xl font-bold text-gray-900">{analysis.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Factures</p>
              <p className="text-2xl font-bold text-gray-900">{totalFiles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Génération de l'analyse...</p>
          </div>
        ) : analysis.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun résultat
            </h3>
            <p className="text-gray-600">
              Aucun badge ne correspond aux critères de recherche.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analysis.map((item) => (
                <div key={item.badge.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <BadgeComponent badge={item.badge} variant="default" />
                    <span className="text-sm font-medium text-gray-600">
                      {item.percentage_of_budget.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Montant total</span>
                      <span className="font-medium">{formatAmount(item.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Factures</span>
                      <span className="font-medium">{item.files_count}</span>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(item.percentage_of_budget, 100)}%`,
                          backgroundColor: item.badge.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Badge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factures
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % du total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysis.map((item) => (
                  <tr key={item.badge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <BadgeComponent badge={item.badge} variant="default" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatAmount(item.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.files_count} facture{item.files_count > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.percentage_of_budget.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-800">
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
