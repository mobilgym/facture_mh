import React from 'react';
import { TrendingUp, FileText, CreditCard, CheckCircle, AlertCircle, Target } from 'lucide-react';

interface LettrageStatsProps {
  stats: {
    totalInvoices: number;
    totalPayments: number;
    matchedInvoices: number;
    matchedPayments: number;
    unmatchedInvoices: number;
    unmatchedPayments: number;
    totalInvoiceAmount: number;
    totalPaymentAmount: number;
    matchedAmount: number;
    unmatchedInvoiceAmount: number;
    matchingRate: number;
  };
}

export function LettrageStats({ stats }: LettrageStatsProps) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const progressPercentage = Math.round(stats.matchingRate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Taux de lettrage */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-blue-700">{progressPercentage}%</span>
        </div>
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Taux de lettrage</h3>
        <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-sm text-blue-700">
          {stats.matchedInvoices} / {stats.totalInvoices} factures lettrées
        </p>
      </div>

      {/* Factures */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-600 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-green-700">{stats.totalInvoices}</span>
        </div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">Factures</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-green-700">✅ Lettrées:</span>
            <span className="font-medium text-green-800">{stats.matchedInvoices}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-700">⏳ En attente:</span>
            <span className="font-medium text-green-800">{stats.unmatchedInvoices}</span>
          </div>
        </div>
      </div>

      {/* Paiements */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-600 rounded-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-purple-700">{stats.totalPayments}</span>
        </div>
        <h3 className="text-lg font-semibold text-purple-900 mb-2">Paiements CSV</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-purple-700">✅ Assignés:</span>
            <span className="font-medium text-purple-800">{stats.matchedPayments}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-purple-700">⏳ Libres:</span>
            <span className="font-medium text-purple-800">{stats.unmatchedPayments}</span>
          </div>
        </div>
      </div>

      {/* Montants */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-600 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold text-orange-700">
            {formatCurrency(stats.matchedAmount)}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-orange-900 mb-2">Montant lettré</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-orange-700">Total factures:</span>
            <span className="font-medium text-orange-800">
              {formatCurrency(stats.totalInvoiceAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-orange-700">Restant:</span>
            <span className="font-medium text-orange-800">
              {formatCurrency(stats.unmatchedInvoiceAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Alerte si différence importante */}
      {Math.abs(stats.totalInvoiceAmount - stats.totalPaymentAmount) > 100 && (
        <div className="md:col-span-2 lg:col-span-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <div>
              <h4 className="font-semibold text-amber-900">Différence détectée</h4>
              <p className="text-sm text-amber-700">
                Différence entre total factures ({formatCurrency(stats.totalInvoiceAmount)}) 
                et total paiements ({formatCurrency(stats.totalPaymentAmount)}): 
                <span className="font-medium">
                  {formatCurrency(Math.abs(stats.totalInvoiceAmount - stats.totalPaymentAmount))}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
