import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, Tag, TrendingUp, RefreshCw } from 'lucide-react';
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
  const { badges } = useBudgetBadges(budget.id);
  const { generateAnalysis } = useBadges();
  const { onBudgetChange } = useBudgetNotification();

  console.log('🔍 BudgetDetails - Budget ID:', budget.id);
  console.log('🏷️ BudgetDetails - Badges chargés:', badges.length);
  console.log('📊 BudgetDetails - Analyse des badges:', badgeAnalysis.length);
  console.log('🔄 BudgetDetails - Refreshing:', isRefreshing);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {budget.name}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                // Debug : vérifier les dépenses en base
                const { data, error } = await supabase
                  .from('expenses')
                  .select('*')
                  .eq('budget_id', budget.id);
                console.log('🔍 DEBUG - Dépenses en base pour ce budget:', data, error);
              }}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
              title="Debug - vérifier les dépenses en base"
            >
              DEBUG
            </button>
            <button
              onClick={handleRecalculateBudget}
              disabled={isRefreshing}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded disabled:opacity-50"
              title="Recalculer le montant dépensé basé sur les badges"
            >
              {isRefreshing ? 'Calcul...' : 'Recalculer'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Actualiser les dépenses"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Résumé du budget */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-700">Budget Initial</p>
              <p className="text-2xl font-bold text-green-900">{formatAmount(budget.initial_amount)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-700">Dépensé</p>
              <p className="text-2xl font-bold text-blue-900">{formatAmount(budget.spent_amount)}</p>
            </div>
            <div className="bg-cyan-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-cyan-700">Restant</p>
              <p className="text-2xl font-bold text-cyan-900">{formatAmount(budget.remaining_amount)}</p>
            </div>
          </div>

          {/* Liste des postes de dépenses */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Badges
            </h3>

            {isRefreshing ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des badges...</p>
              </div>
            ) : badgeAnalysis.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Aucun badge n'est associé à ce budget ou aucune facture n'utilise les badges.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {badgeAnalysis.map((analysis) => {
                  const isExpanded = expandedBadges.has(analysis.badge.id);
                  const percentage = budget.initial_amount > 0 
                    ? (analysis.total_amount / budget.initial_amount) * 100 
                    : 0;

                  return (
                    <div 
                      key={analysis.badge.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* En-tête du badge */}
                      <button
                        onClick={() => toggleBadge(analysis.badge.id)}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          <BadgeComponent badge={analysis.badge} variant="default" />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatAmount(analysis.total_amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {percentage.toFixed(1)}% du budget
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 text-xs">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {analysis.files_count} facture{analysis.files_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Liste des factures */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          {analysis.files.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                              {analysis.files.map((file) => (
                                <div 
                                  key={file.id}
                                  className="p-4 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <p className="font-medium text-gray-900">
                                          {file.name}
                                        </p>
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                                          title="Voir le fichier"
                                        >
                                          📄 Ouvrir
                                        </a>
                                      </div>
                                      <div className="flex items-center space-x-4 mt-1">
                                        <p className="text-sm text-gray-500">
                                          {formatDate(file.document_date)}
                                        </p>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          Assignée
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-gray-900">
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
