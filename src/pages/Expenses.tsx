import React, { useState } from 'react';
import { Plus, Filter, Download, BarChart3, Calendar, DollarSign } from 'lucide-react';
import { ExpenseCard } from '../components/expenses/ExpenseCard';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { useExpenses } from '../hooks/useExpenses';
import { useBudgets } from '../hooks/useBudgets';
import { useBadges } from '../hooks/useBadges';
import type { ExpenseWithDetails, CreateExpenseForm, ExpenseStatus } from '../types/budget';

type FilterType = 'all' | 'pending' | 'approved' | 'paid' | 'cancelled';

export function Expenses() {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  const {
    expenses,
    loading,
    createExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    markAsPaid
  } = useExpenses();

  const { budgets } = useBudgets();
  const { activeBadges } = useBadges();

  // Filtrer les dépenses
  const filteredExpenses = expenses.filter(expense => {
    // Filtre par statut
    if (filterStatus !== 'all' && expense.status !== filterStatus) {
      return false;
    }

    // Filtre par budget
    if (selectedBudget && expense.budget_id !== selectedBudget) {
      return false;
    }

    // Filtre par badge (temporairement désactivé - à implémenter avec le nouveau système)
    // if (selectedBadge && expense.badge_ids && !expense.badge_ids.includes(selectedBadge)) {
    //   return false;
    // }

    // Filtre par date
    if (dateRange.start && expense.expense_date < dateRange.start) {
      return false;
    }
    if (dateRange.end && expense.expense_date > dateRange.end) {
      return false;
    }

    return true;
  });

  // Statistiques
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingCount = filteredExpenses.filter(e => e.status === 'pending').length;
  const approvedCount = filteredExpenses.filter(e => e.status === 'approved').length;
  const paidCount = filteredExpenses.filter(e => e.status === 'paid').length;

  // Gestion des dépenses
  const handleCreateExpense = async (data: CreateExpenseForm) => {
    await createExpense(data);
    setShowExpenseForm(false);
  };

  const handleEditExpense = (expense: ExpenseWithDetails) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleUpdateExpense = async (data: CreateExpenseForm) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
      setEditingExpense(null);
      setShowExpenseForm(false);
    }
  };

  const handleCloseExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      await deleteExpense(expenseId);
    }
  };

  const handleApproveExpense = async (expenseId: string) => {
    await approveExpense(expenseId);
  };

  const handleMarkAsPaid = async (expenseId: string) => {
    await markAsPaid(expenseId);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusLabel = (status: ExpenseStatus) => {
    const labels = {
      pending: 'En attente',
      approved: 'Approuvées',
      paid: 'Payées',
      cancelled: 'Annulées'
    };
    return labels[status];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Dépenses
          </h1>
          <p className="text-gray-600">
            Créez et gérez vos dépenses avec ou sans fichiers
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Dépenses</p>
                <p className="text-2xl font-semibold text-gray-900">{formatAmount(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En Attente</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approuvées</p>
                <p className="text-2xl font-semibold text-gray-900">{approvedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Payées</p>
                <p className="text-2xl font-semibold text-gray-900">{paidCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Filtre par statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterType)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvées</option>
                  <option value="paid">Payées</option>
                  <option value="cancelled">Annulées</option>
                </select>
              </div>

              {/* Filtre par budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les budgets</option>
                  {budgets.map((budget) => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par badge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge
                </label>
                <select
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled
                >
                  <option value="">Tous les badges</option>
                  {activeBadges.map((badge) => (
                    <option key={badge.id} value={badge.id}>
                      {badge.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Filtrage temporairement désactivé - Migration en cours
                </p>
              </div>

              {/* Filtre par date */}
              <div className="flex space-x-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Du
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Au
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </button>

              <button
                onClick={() => setShowExpenseForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Dépense
              </button>
            </div>
          </div>

          {/* Réinitialiser les filtres */}
          {(filterStatus !== 'all' || selectedBudget || selectedBadge || dateRange.start || dateRange.end) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSelectedBudget('');
                  setSelectedBadge('');
                  setDateRange({ start: '', end: '' });
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        {/* Liste des dépenses */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des dépenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune dépense trouvée
            </h3>
            <p className="text-gray-600 mb-4">
              {expenses.length === 0 
                ? "Commencez par créer votre première dépense."
                : "Aucune dépense ne correspond aux filtres sélectionnés."
              }
            </p>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer une Dépense
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                onApprove={handleApproveExpense}
                onMarkAsPaid={handleMarkAsPaid}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {showExpenseForm && (
        <ExpenseForm
          expense={editingExpense}
          onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
          onClose={handleCloseExpenseForm}
        />
      )}
    </div>
  );
}
