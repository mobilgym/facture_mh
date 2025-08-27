import React from 'react';
import { Wallet, TrendingUp, FileText, DollarSign } from 'lucide-react';

interface TreasuryCardProps {
  totalBudgets: number;
  remainingBudgets: number;
  totalVteInvoices: number;
  globalTreasury: number;
  activeBudgetsCount: number;
  vteInvoicesCount: number;
  className?: string;
}

export function TreasuryCard({
  totalBudgets,
  remainingBudgets,
  totalVteInvoices,
  globalTreasury,
  activeBudgetsCount,
  vteInvoicesCount,
  className = ''
}: TreasuryCardProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <div className="p-3 bg-blue-600 rounded-lg">
          <Wallet className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">Trésorerie Globale</h3>
          <p className="text-sm text-gray-600">
            Vue d'ensemble des budgets et recettes VTE
          </p>
        </div>
      </div>

      {/* Montant principal */}
      <div className="mb-6 text-center">
        <div className="text-3xl font-bold text-blue-600 mb-1">
          {formatAmount(globalTreasury)}
        </div>
        <p className="text-sm text-gray-600">
          Trésorerie totale disponible
        </p>
      </div>

      {/* Détail des composants */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Budgets Restants</span>
          </div>
          <div className="text-xl font-semibold text-green-600">
            {formatAmount(remainingBudgets)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {activeBudgetsCount} budget{activeBudgetsCount > 1 ? 's' : ''} actif{activeBudgetsCount > 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center mb-2">
            <FileText className="h-4 w-4 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Factures VTE</span>
          </div>
          <div className="text-xl font-semibold text-purple-600">
            {formatAmount(totalVteInvoices)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {vteInvoicesCount} facture{vteInvoicesCount > 1 ? 's' : ''} VTE
          </div>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <div className="flex items-center mb-3">
          <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-gray-700">Répartition</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total budgets alloués:</span>
            <span className="font-medium">{formatAmount(totalBudgets)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Montant restant budgets:</span>
            <span className="font-medium text-green-600">{formatAmount(remainingBudgets)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total factures VTE:</span>
            <span className="font-medium text-purple-600">{formatAmount(totalVteInvoices)}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-gray-900">Trésorerie globale:</span>
              <span className="text-blue-600">{formatAmount(globalTreasury)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur visuel */}
      {globalTreasury > 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <TrendingUp className="h-3 w-3 mr-1" />
            Trésorerie positive
          </div>
        </div>
      )}
      
      {globalTreasury < 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
            Attention : Trésorerie négative
          </div>
        </div>
      )}
    </div>
  );
}
