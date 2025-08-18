import React, { useState } from 'react';
import { Plus, AlertTriangle, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { BudgetDetails } from '../components/budgets/BudgetDetails';
import { BudgetForm } from '../components/budgets/BudgetForm';
import { ExpenseCategoryCard } from '../components/expense-categories/ExpenseCategoryCard';
import { ExpenseCategoryForm } from '../components/expense-categories/ExpenseCategoryForm';
import { ExpenseAnalysisTable } from '../components/analysis/ExpenseAnalysisTable';
import { useBudgets } from '../hooks/useBudgets';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import type { BudgetWithStats, ExpenseCategoryWithStats, CreateBudgetForm, CreateExpenseCategoryForm } from '../types/budget';

type TabType = 'budgets' | 'categories' | 'analysis';

export function BudgetsAndExpenses() {
  const [activeTab, setActiveTab] = useState<TabType>('budgets');
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithStats | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithStats | null>(null);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryWithStats | null>(null);

  const { user } = useAuth();
  const { selectedCompany } = useCompany();

  const {
    budgets,
    alerts,
    loading: budgetsLoading,
    createBudget,
    updateBudget,
    archiveBudget,
    deleteBudget
  } = useBudgets();

  const {
    categories,
    loading: categoriesLoading,
    createCategory,
    updateCategory,
    archiveCategory,
    deleteCategory
  } = useExpenseCategories();

  // Gestion des budgets
  const handleCreateBudget = async (data: CreateBudgetForm, categoryIds?: string[]) => {
    console.log('🔍 Tentative de création du budget:', data);
    console.log('📋 Postes de dépenses sélectionnés:', categoryIds);
    console.log('👤 État de l\'utilisateur:', user);
    console.log('🏢 État de l\'entreprise:', selectedCompany);

    if (!user || !selectedCompany) {
      console.error('❌ Utilisateur ou entreprise manquant');
      return;
    }

    const newBudget = await createBudget(data, categoryIds);
    if (newBudget) {
      console.log('✅ Budget créé avec succès:', newBudget);
      setShowBudgetForm(false);
    } else {
      console.error('❌ Échec de la création du budget');
    }
  };

  const handleEditBudget = (budget: BudgetWithStats) => {
    setEditingBudget(budget);
    setShowBudgetForm(true);
  };

  const handleUpdateBudget = async (data: CreateBudgetForm, categoryIds?: string[]) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
      setEditingBudget(null);
      setShowBudgetForm(false);
    }
  };

  const handleCloseBudgetForm = () => {
    setShowBudgetForm(false);
    setEditingBudget(null);
  };

  // Gestion des postes de dépenses
  const handleCreateCategory = async (data: CreateExpenseCategoryForm) => {
    await createCategory(data);
    setShowCategoryForm(false);
  };

  const handleEditCategory = (category: ExpenseCategoryWithStats) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleUpdateCategory = async (data: CreateExpenseCategoryForm) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
      setEditingCategory(null);
      setShowCategoryForm(false);
    }
  };

  const handleCloseCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  // Statistiques générales
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.initial_amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent_amount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overBudgetCount = budgets.filter(budget => budget.is_over_budget).length;

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                Budgets ({budgets.length})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Postes de Dépenses ({categories.length})
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
                    onDelete={deleteBudget}
                    onClick={() => setSelectedBudget(budget)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            {/* En-tête avec bouton d'ajout */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Postes de Dépenses
              </h2>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Poste
              </button>
            </div>

            {/* Liste des postes */}
            {categoriesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Chargement des postes de dépenses...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun poste de dépense
                </h3>
                <p className="text-gray-600 mb-4">
                  Créez des postes pour catégoriser vos dépenses.
                </p>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un Poste
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <ExpenseCategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleEditCategory}
                    onArchive={archiveCategory}
                    onDelete={deleteCategory}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Analyse des Dépenses
              </h2>
              <p className="text-gray-600 mt-1">
                Tableaux de bord et analyses détaillées de vos dépenses par poste, budget et période.
              </p>
            </div>
            <ExpenseAnalysisTable />
          </div>
        )}
      </div>

      {/* Modales */}
      {selectedBudget && (
        <BudgetDetails
          budget={selectedBudget}
          onClose={() => setSelectedBudget(null)}
        />
      )}

      {showBudgetForm && (
        <BudgetForm
          budget={editingBudget}
          onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
          onClose={handleCloseBudgetForm}
        />
      )}

      {showCategoryForm && (
        <ExpenseCategoryForm
          category={editingCategory}
          onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
          onClose={handleCloseCategoryForm}
        />
      )}
    </div>
  );
}
