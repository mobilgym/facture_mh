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
    <div className={`budget-container bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-4 sm:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6 min-w-0">
        <div className="p-2.5 bg-blue-600 rounded-lg shrink-0">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-fit-md font-semibold text-gray-900 truncate">Trésorerie Globale</h3>
          <p className="text-fit-xs text-gray-600 line-clamp-2">
            Vue d'ensemble des budgets et recettes VTE
          </p>
        </div>
      </div>

      {/* Montant principal */}
      <div className="mb-4 sm:mb-6 text-center">
        <div className="text-fit-xl font-bold text-blue-600 mb-1 truncate tabular-nums">
          {formatAmount(globalTreasury)}
        </div>
        <p className="text-fit-xs text-gray-600">
          Trésorerie totale disponible
        </p>
      </div>

      {/* Détail des composants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100 min-w-0">
          <div className="flex items-center mb-2 text-fit-xs text-gray-700">
            <TrendingUp className="h-3.5 w-3.5 text-green-600 mr-2 shrink-0" />
            <span className="font-medium truncate">Budgets Restants</span>
          </div>
          <div className="text-fit-lg font-semibold text-green-600 truncate">
            {formatAmount(remainingBudgets)}
          </div>
          <div className="text-fit-xs text-gray-500 mt-1 truncate">
            {activeBudgetsCount} budget{activeBudgetsCount > 1 ? 's' : ''} actif{activeBudgetsCount > 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100 min-w-0">
          <div className="flex items-center mb-2 text-fit-xs text-gray-700">
            <FileText className="h-3.5 w-3.5 text-purple-600 mr-2 shrink-0" />
            <span className="font-medium truncate">Factures VTE</span>
          </div>
          <div className="text-fit-lg font-semibold text-purple-600 truncate">
            {formatAmount(totalVteInvoices)}
          </div>
          <div className="text-fit-xs text-gray-500 mt-1 truncate">
            {vteInvoicesCount} facture{vteInvoicesCount > 1 ? 's' : ''} VTE
          </div>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100">
        <div className="flex items-center mb-3 text-fit-xs text-gray-700">
          <DollarSign className="h-3.5 w-3.5 text-blue-600 mr-2 shrink-0" />
          <span className="font-medium">Répartition</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-fit-xs gap-2">
            <span className="text-gray-600 truncate">Total budgets alloués:</span>
            <span className="font-medium truncate">{formatAmount(totalBudgets)}</span>
          </div>
          <div className="flex justify-between items-center text-fit-xs gap-2">
            <span className="text-gray-600 truncate">Montant restant budgets:</span>
            <span className="font-medium text-green-600 truncate">{formatAmount(remainingBudgets)}</span>
          </div>
          <div className="flex justify-between items-center text-fit-xs gap-2">
            <span className="text-gray-600 truncate">Total factures VTE:</span>
            <span className="font-medium text-purple-600 truncate">{formatAmount(totalVteInvoices)}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center text-fit-xs font-semibold gap-2">
              <span className="text-gray-900 truncate">Trésorerie globale:</span>
              <span className="text-blue-600 truncate">{formatAmount(globalTreasury)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur visuel */}
      {globalTreasury > 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-fit-xs font-medium bg-green-100 text-green-700">
            <TrendingUp className="h-3 w-3 mr-1" />
            Trésorerie positive
          </div>
        </div>
      )}
      
      {globalTreasury < 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-fit-xs font-medium bg-red-100 text-red-700">
            <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
            Attention : Trésorerie négative
          </div>
        </div>
      )}
    </div>
  );
}
