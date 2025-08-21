import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronDown, ChevronRight, Tag, TrendingUp, RefreshCw, Check, Filter } from 'lucide-react';
import type { BudgetWithStats } from '../../types/budget';
import type { Badge, BadgeAnalysis } from '../../types/badge';
import { useBudgetBadges } from '../../hooks/useBudgetBadges';
import { useBadges } from '../../hooks/useBadges';
import { useBudgetNotification } from '../../contexts/BudgetNotificationContext';
import { supabase } from '../../lib/supabase';
import { Badge as BadgeComponent } from '../badges/Badge';
import { BudgetService } from '../../lib/services/budgetService';
import { BadgeService } from '../../lib/services/badgeService';

interface BudgetDetailsProps {
  budget: BudgetWithStats;
  onClose: () => void;
}

export function BudgetDetails({ budget, onClose }: BudgetDetailsProps) {
  const [expandedBadges, setExpandedBadges] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [badgeAnalysis, setBadgeAnalysis] = useState<BadgeAnalysis[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<Set<string>>(new Set());
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const { badges } = useBudgetBadges(budget.id);
  const { generateAnalysis } = useBadges();
  const { onBudgetChange } = useBudgetNotification();

  console.log('🔍 BudgetDetails - Budget ID:', budget.id);
  console.log('🏷️ BudgetDetails - Badges chargés:', badges.length);
  console.log('📊 BudgetDetails - Analyse des badges:', badgeAnalysis.length);
  console.log('🔄 BudgetDetails - Refreshing:', isRefreshing);
  console.log('🎯 BudgetDetails - Badges sélectionnés:', Array.from(selectedBadges));
  console.log('👁️ BudgetDetails - Afficher seulement sélectionnés:', showOnlySelected);

  // Fonction pour basculer la sélection d'un badge
  const toggleBadgeSelection = (badgeId: string) => {
    setSelectedBadges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(badgeId)) {
        newSet.delete(badgeId);
      } else {
        newSet.add(badgeId);
      }
      return newSet;
    });
  };

  // Fonction pour sélectionner/désélectionner tous les badges
  const toggleAllBadges = () => {
    if (selectedBadges.size === badgeAnalysis.length) {
      setSelectedBadges(new Set());
    } else {
      setSelectedBadges(new Set(badgeAnalysis.map(analysis => analysis.badge.id)));
    }
  };

  // Calcul dynamique des statistiques basées sur la sélection
  const dynamicStats = useMemo(() => {
    if (selectedBadges.size === 0 || !showOnlySelected) {
      // Si aucun badge sélectionné ou mode normal, afficher toutes les stats
      const totalAmount = badgeAnalysis.reduce((sum, analysis) => sum + analysis.total_amount, 0);
      const totalFiles = badgeAnalysis.reduce((sum, analysis) => sum + analysis.files_count, 0);
      const percentage = budget.initial_amount > 0 ? (totalAmount / budget.initial_amount) * 100 : 0;
      
      return {
        totalAmount,
        totalFiles,
        percentage,
        remainingAmount: budget.initial_amount - totalAmount
      };
    } else {
      // Calculer les stats seulement pour les badges sélectionnés
      const selectedAnalysis = badgeAnalysis.filter(analysis => selectedBadges.has(analysis.badge.id));
      const totalAmount = selectedAnalysis.reduce((sum, analysis) => sum + analysis.total_amount, 0);
      const totalFiles = selectedAnalysis.reduce((sum, analysis) => sum + analysis.files_count, 0);
      const percentage = budget.initial_amount > 0 ? (totalAmount / budget.initial_amount) * 100 : 0;
      
      return {
        totalAmount,
        totalFiles,
        percentage,
        remainingAmount: budget.initial_amount - totalAmount
      };
    }
  }, [badgeAnalysis, selectedBadges, showOnlySelected, budget.initial_amount]);

  // Filtrage des badges à afficher
  const displayedBadges = useMemo(() => {
    if (showOnlySelected && selectedBadges.size > 0) {
      return badgeAnalysis.filter(analysis => selectedBadges.has(analysis.badge.id));
    }
    return badgeAnalysis;
  }, [badgeAnalysis, selectedBadges, showOnlySelected]);

  // Fonction de rafraîchissement avec protection
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      console.log('🔄 BudgetDetails - Génération de l\'analyse des badges pour le budget:', budget.id);
      const analysis = await generateAnalysis(budget.id);
      setBadgeAnalysis(analysis);
      console.log('✅ BudgetDetails - Analyse des badges mise à jour:', analysis.length);
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement des badges:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [generateAnalysis, budget.id, isRefreshing]);

  // Fonction pour recalculer le montant dépensé du budget
  const handleRecalculateBudget = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      console.log('🔄 BudgetDetails - Recalcul du montant dépensé pour le budget:', budget.id);
      await BadgeService.recalculateBudgetSpentAmount(budget.id);
      console.log('✅ BudgetDetails - Montant dépensé recalculé avec succès');
      
      // Actualiser la page pour voir les changements
      window.location.reload();
    } catch (error) {
      console.error('❌ Erreur lors du recalcul du montant dépensé:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [budget.id, isRefreshing]);

  // Charger l'analyse à l'ouverture de la modale
  useEffect(() => {
    console.log('🔄 BudgetDetails - Ouverture de la modale, chargement de l\'analyse');
    handleRefresh();
  }, []); // Vide = seulement au montage

  const toggleBadge = (badgeId: string) => {
    setExpandedBadges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(badgeId)) {
        newSet.delete(badgeId);
      } else {
        newSet.add(badgeId);
      }
      return newSet;
    });
  };

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

  console.log('📊 BudgetDetails - Badges du budget:', badges.map(b => ({ id: b.id, name: b.name })));
  console.log('📊 BudgetDetails - Analyse détaillée des badges:', badgeAnalysis);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-2">
            {budget.name}
          </h2>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Bouton DEBUG - masqué sur mobile */}
            <button
              onClick={async () => {
                // Debug : vérifier les dépenses en base
                const { data, error } = await supabase
                  .from('expenses')
                  .select('*')
                  .eq('budget_id', budget.id);
                console.log('🔍 DEBUG - Dépenses en base pour ce budget:', data, error);
              }}
              className="hidden sm:block px-2 sm:px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
              title="Debug - vérifier les dépenses en base"
            >
              DEBUG
            </button>
            <button
              onClick={handleRecalculateBudget}
              disabled={isRefreshing}
              className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded disabled:opacity-50"
              title="Recalculer le montant dépensé basé sur les badges"
            >
              {isRefreshing ? 'Calcul...' : (
                <span className="hidden sm:inline">Recalculer</span>
              )}
              <span className="sm:hidden">↻</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Actualiser les dépenses"
            >
              <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Résumé du budget avec statistiques dynamiques */}
          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            {/* Résumé du budget original */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-green-700">Budget Initial</p>
                <p className="text-lg sm:text-2xl font-bold text-green-900">{formatAmount(budget.initial_amount)}</p>
              </div>
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-blue-700">Dépensé (Original)</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">{formatAmount(budget.spent_amount)}</p>
              </div>
              <div className="bg-cyan-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-cyan-700">Restant (Original)</p>
                <p className="text-lg sm:text-2xl font-bold text-cyan-900">{formatAmount(budget.remaining_amount)}</p>
              </div>
            </div>

            {/* Statistiques dynamiques basées sur la sélection */}
            {selectedBadges.size > 0 && showOnlySelected && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-purple-800">
                    📊 Statistiques des badges sélectionnés
                  </h4>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                    {selectedBadges.size} badge{selectedBadges.size > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-purple-600">Montant Total</p>
                    <p className="text-lg font-bold text-purple-900">{formatAmount(dynamicStats.totalAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-purple-600">% du Budget</p>
                    <p className="text-lg font-bold text-purple-900">{dynamicStats.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-purple-600">Factures</p>
                    <p className="text-lg font-bold text-purple-900">{dynamicStats.totalFiles}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-purple-600">Impact Restant</p>
                    <p className="text-lg font-bold text-purple-900">{formatAmount(dynamicStats.remainingAmount)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Liste des badges avec contrôles de sélection */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                Badges
              </h3>
              
              {/* Contrôles de sélection */}
              {badgeAnalysis.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleAllBadges}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      {selectedBadges.size === badgeAnalysis.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                    {selectedBadges.size > 0 && (
                      <span className="text-xs text-gray-500">
                        ({selectedBadges.size}/{badgeAnalysis.length})
                      </span>
                    )}
                  </div>
                  
                  {selectedBadges.size > 0 && (
                    <button
                      onClick={() => setShowOnlySelected(!showOnlySelected)}
                      className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        showOnlySelected 
                          ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Filter className="h-3 w-3 mr-1" />
                      {showOnlySelected ? 'Afficher tous' : 'Seulement sélectionnés'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {isRefreshing ? (
              <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-gray-600">Chargement des badges...</p>
              </div>
            ) : badgeAnalysis.length === 0 ? (
              <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                <Tag className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-600 px-4">
                  Aucun badge n'est associé à ce budget ou aucune facture n'utilise les badges.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedBadges.map((analysis) => {
                  const isExpanded = expandedBadges.has(analysis.badge.id);
                  const isSelected = selectedBadges.has(analysis.badge.id);
                  const percentage = budget.initial_amount > 0 
                    ? (analysis.total_amount / budget.initial_amount) * 100 
                    : 0;

                  return (
                    <div 
                      key={analysis.badge.id}
                      className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {/* En-tête du badge avec checkbox */}
                      <div className="flex items-center p-3 sm:p-4">
                        {/* Checkbox de sélection */}
                        <div 
                          className="flex-shrink-0 mr-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBadgeSelection(analysis.badge.id);
                          }}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected 
                              ? 'bg-purple-500 border-purple-500' 
                              : 'border-gray-300 hover:border-purple-400'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>

                        {/* Bouton d'expansion */}
                        <button
                          onClick={() => toggleBadge(analysis.badge.id)}
                          className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors rounded"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <BadgeComponent badge={analysis.badge} variant="default" />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 flex-shrink-0 ml-2">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatAmount(analysis.total_amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {percentage.toFixed(1)}% du budget
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 text-xs">
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {analysis.files_count} <span className="hidden sm:inline">facture{analysis.files_count !== 1 ? 's' : ''}</span>
                                <span className="sm:hidden">fact.</span>
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Liste des factures */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          {analysis.files.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                              {analysis.files.map((file) => (
                                <div 
                                  key={file.id}
                                  className="p-3 sm:p-4 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                        <p className="font-medium text-gray-900 truncate">
                                          {file.name}
                                        </p>
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-800 underline inline-flex items-center flex-shrink-0"
                                          title="Voir le fichier"
                                        >
                                          📄 <span className="hidden sm:inline ml-1">Ouvrir</span>
                                        </a>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1">
                                        <p className="text-xs sm:text-sm text-gray-500">
                                          {formatDate(file.document_date)}
                                        </p>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                                          Assignée
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-left sm:text-right flex-shrink-0">
                                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                                        {formatAmount(file.amount)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              <p className="text-sm">Aucune facture pour ce badge</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
