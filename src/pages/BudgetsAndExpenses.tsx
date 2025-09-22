import React, { useState } from 'react';
import { Plus, AlertTriangle, TrendingUp, PieChart, BarChart3, Wallet } from 'lucide-react';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { BudgetDetails } from '../components/budgets/BudgetDetails';
import { BudgetForm } from '../components/budgets/BudgetForm';
import { BadgeCard } from '../components/badges/BadgeCard';
import { BadgeForm } from '../components/badges/BadgeForm';
import { BadgeAnalysis } from '../components/analysis/BadgeAnalysis';
import { TreasuryCard } from '../components/treasury/TreasuryCard';
import { VteInvoicesList } from '../components/treasury/VteInvoicesList';
import { useBudgets } from '../hooks/useBudgets';
import { useBadges } from '../hooks/useBadges';
import { useTreasury } from '../hooks/useTreasury';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import type { BudgetWithStats, CreateBudgetForm } from '../types/budget';
import type { BadgeWithStats, CreateBadgeForm } from '../types/badge';

type TabType = 'budgets' | 'badges' | 'analysis' | 'treasury';

export function BudgetsAndExpenses() {
  const [activeTab, setActiveTab] = useState<TabType>('budgets');
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithStats | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithStats | null>(null);
  const [editingBadge, setEditingBadge] = useState<BadgeWithStats | null>(null);
  const [recalculatingBudgets, setRecalculatingBudgets] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const { selectedCompany } = useCompany();

  const {
    budgets,
    alerts,
    loading: budgetsLoading,
    createBudget,
    updateBudget,
    archiveBudget,
    toggleBudgetStatus,
    deleteBudget,
    refreshBudgets,
    refreshBudgetsNoRecalc
  } = useBudgets();

  const {
    badges,
    loading: badgesLoading,
    createBadge,
    updateBadge,
    archiveBadge,
    deleteBadge,
    reactivateBadge
  } = useBadges();

  const {
    treasury,
    loading: treasuryLoading,
    totalBudgets: treasuryTotalBudgets,
    remainingBudgets,
    totalVteInvoices,
    globalTreasury,
    activeBudgetsCount,
    vteInvoicesCount,
    vteInvoices,
    refreshTreasury
  } = useTreasury();

  // Gestion des budgets
  const handleCreateBudget = async (data: CreateBudgetForm, badgeIds?: string[]) => {
    console.log('🔍 Tentative de création du budget:', data);
    console.log('🏷️ Badges sélectionnés:', badgeIds);
    console.log('👤 État de l\'utilisateur:', user);
    console.log('🏢 État de l\'entreprise:', selectedCompany);

    if (!user || !selectedCompany) {
      console.error('❌ Utilisateur ou entreprise manquant');
      return;
    }

    const newBudget = await createBudget(data, badgeIds);
    if (newBudget) {
      console.log('✅ Budget créé avec succès:', newBudget);
      setShowBudgetForm(false);
      // Rafraîchir la trésorerie après création d'un budget
      await refreshTreasury();
    } else {
      console.error('❌ Échec de la création du budget');
    }
  };

  const handleEditBudget = (budget: BudgetWithStats) => {
    setEditingBudget(budget);
    setShowBudgetForm(true);
  };

  const handleUpdateBudget = async (data: CreateBudgetForm, badgeIds?: string[]) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
      setEditingBudget(null);
      setShowBudgetForm(false);
      // Rafraîchir la trésorerie après modification d'un budget
      await refreshTreasury();
    }
  };

  const handleCloseBudgetForm = () => {
    setShowBudgetForm(false);
    setEditingBudget(null);
  };

  // Gestion des badges
  const handleCreateBadge = async (data: CreateBadgeForm) => {
    await createBadge(data);
    setShowBadgeForm(false);
  };

  const handleEditBadge = (badge: BadgeWithStats) => {
    setEditingBadge(badge);
    setShowBadgeForm(true);
  };

  const handleUpdateBadge = async (data: CreateBadgeForm) => {
    if (editingBadge) {
      await updateBadge(editingBadge.id, data);
      setEditingBadge(null);
      setShowBadgeForm(false);
    }
  };

  const handleCloseBadgeForm = () => {
    setShowBadgeForm(false);
    setEditingBadge(null);
  };

  const handleDeleteBadge = async (badge: BadgeWithStats) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le badge "${badge.name}" ? Cette action est irréversible.`)) {
      await deleteBadge(badge.id);
    }
  };

  const handleArchiveBadge = async (badge: BadgeWithStats) => {
    if (window.confirm(`Êtes-vous sûr de vouloir archiver le badge "${badge.name}" ?`)) {
      await archiveBadge(badge.id);
    }
  };

  const handleReactivateBadge = async (badge: BadgeWithStats) => {
    if (window.confirm(`Êtes-vous sûr de vouloir réactiver le badge "${badge.name}" ?`)) {
      await reactivateBadge(badge.id);
    }
  };

  // Gestion du recalcul des budgets
  const handleRecalculateBudget = async (budgetId: string) => {
    // Marquer ce budget comme en cours de recalcul
    setRecalculatingBudgets(prev => new Set(prev).add(budgetId));

    try {
      console.log('🔄 Recalcul du budget:', budgetId);

      // Import dynamique pour éviter les dépendances circulaires
      const { BadgeService } = await import('../lib/services/badgeService');
      await BadgeService.recalculateBudgetSpentAmount(budgetId);

      console.log('✅ Recalcul terminé, rafraîchissement des données...');

      // Attendre un peu pour s'assurer que la DB est à jour
      await new Promise(resolve => setTimeout(resolve, 200));

      // Rafraîchir les données sans recalcul supplémentaire
      await Promise.all([
        refreshTreasury(),
        refreshBudgetsNoRecalc() // Rafraîchir sans recalculer tous les budgets
      ]);

      console.log('✅ Budget recalculé avec succès et données rafraîchies');
    } catch (error) {
      console.error('❌ Erreur lors du recalcul du budget:', error);
    } finally {
      // Retirer ce budget de la liste des budgets en cours de recalcul
      setRecalculatingBudgets(prev => {
        const newSet = new Set(prev);
        newSet.delete(budgetId);
        return newSet;
      });
    }
  };

  // Statistiques générales (budgets actifs uniquement)
  const activeBudgets = budgets.filter(budget => budget.is_active);
  const totalBudget = activeBudgets.reduce((sum, budget) => sum + budget.initial_amount, 0);
  const totalSpent = activeBudgets.reduce((sum, budget) => sum + budget.spent_amount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overBudgetCount = activeBudgets.filter(budget => budget.is_over_budget).length;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Budgets & Postes de Dépenses
          </h1>
          <p className="text-gray-600">
            Gérez vos budgets et organisez vos dépenses par postes
          </p>
        </div>

        {/* Alertes de budget */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-sm font-medium text-yellow-800">
                  Alertes de budget ({alerts.length})
                </h3>
              </div>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.budget_id} className="text-sm text-yellow-700">
                    <strong>{alert.budget_name}:</strong> {alert.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Budget Total</p>
                <p className="text-2xl font-semibold text-gray-900">{formatAmount(totalBudget)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Dépensé</p>
                <p className="text-2xl font-semibold text-gray-900">{formatAmount(totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <PieChart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Restant</p>
                <p className={`text-2xl font-semibold ${
                  totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatAmount(totalRemaining)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Budgets Dépassés</p>
                <p className="text-2xl font-semibold text-gray-900">{overBudgetCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Trésorerie Globale</p>
                <p className={`text-2xl font-semibold ${
                  globalTreasury >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {formatAmount(globalTreasury)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('budgets')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'budgets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Budgets ({activeBudgets.length}/{budgets.length})
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'badges'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Badges ({badges.length})
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analysis'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analyse
              </button>
              <button
                onClick={() => setActiveTab('treasury')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'treasury'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Wallet className="h-4 w-4 inline mr-1" />
                Trésorerie
              </button>
            </nav>
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'budgets' && (
          <div>
            {/* En-tête avec bouton d'ajout */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Gestion des Budgets
              </h2>
              <button
                onClick={() => setShowBudgetForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Budget
              </button>
            </div>

            {/* Liste des budgets */}
            {budgetsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Chargement des budgets...</p>
              </div>
            ) : budgets.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun budget
                </h3>
                <p className="text-gray-600 mb-4">
                  Créez votre premier budget pour commencer à organiser vos dépenses.
                </p>
                <button
                  onClick={() => setShowBudgetForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un Budget
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={handleEditBudget}
                    onArchive={archiveBudget}
                    onToggleStatus={toggleBudgetStatus}
                    onDelete={deleteBudget}
                    onRecalculate={handleRecalculateBudget}
                    isRecalculating={recalculatingBudgets.has(budget.id)}
                    onClick={() => setSelectedBudget(budget)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'badges' && (
          <div>
            {/* En-tête avec bouton d'ajout */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Badges
              </h2>
              <button
                onClick={() => setShowBadgeForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Badge
              </button>
            </div>

            {/* Liste des postes */}
            {badgesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Chargement des badges...</p>
              </div>
            ) : badges.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun badge
                </h3>
                <p className="text-gray-600 mb-4">
                  Créez des badges pour organiser vos dépenses de manière moderne et flexible.
                </p>
                <button
                  onClick={() => setShowBadgeForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un Badge
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    onEdit={handleEditBadge}
                    onArchive={handleArchiveBadge}
                    onDelete={handleDeleteBadge}
                    onReactivate={handleReactivateBadge}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <BadgeAnalysis />
        )}

        {activeTab === 'treasury' && (
          <div>
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Trésorerie Globale
              </h2>
              
              {treasuryLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Chargement de la trésorerie...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Carte principale de trésorerie */}
                  <div className="lg:col-span-2">
                    <TreasuryCard
                      totalBudgets={treasuryTotalBudgets}
                      remainingBudgets={remainingBudgets}
                      totalVteInvoices={totalVteInvoices}
                      globalTreasury={globalTreasury}
                      activeBudgetsCount={activeBudgetsCount}
                      vteInvoicesCount={vteInvoicesCount}
                    />
                  </div>
                  
                  {/* Résumé à droite */}
                  <div className="space-y-6">
                    {/* Statistiques rapides */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Budgets actifs:</span>
                          <span className="font-medium">{activeBudgetsCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Factures VTE:</span>
                          <span className="font-medium">{vteInvoicesCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Efficacité budgets:</span>
                          <span className="font-medium">
                            {treasuryTotalBudgets > 0 
                              ? `${Math.round((remainingBudgets / treasuryTotalBudgets) * 100)}%` 
                              : '0%'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions rapides */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setActiveTab('budgets');
                            setShowBudgetForm(true);
                          }}
                          className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Créer un Budget
                        </button>
                        <button
                          onClick={() => refreshTreasury()}
                          className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Actualiser les Données
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Liste détaillée des factures VTE */}
            {!treasuryLoading && (
              <VteInvoicesList
                invoices={vteInvoices}
                totalAmount={totalVteInvoices}
                className="mt-8"
              />
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {selectedBudget && (
        <BudgetDetails
          budget={selectedBudget}
          onClose={() => setSelectedBudget(null)}
          onBudgetUpdated={() => {
            // Rafraîchir uniquement les données sans recalcul complet
            refreshBudgetsNoRecalc();
          }}
        />
      )}

      {showBudgetForm && (
        <BudgetForm
          budget={editingBudget}
          onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
          onClose={handleCloseBudgetForm}
        />
      )}

      {showBadgeForm && (
        <BadgeForm
          badge={editingBadge}
          onSubmit={editingBadge ? handleUpdateBadge : handleCreateBadge}
          onClose={handleCloseBadgeForm}
        />
      )}
    </div>
  );
}
