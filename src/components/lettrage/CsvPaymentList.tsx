import React from 'react';
import { Search, CreditCard, CheckCircle, Clock, Banknote } from 'lucide-react';
import type { CsvPayment, LettrageMatch } from '../../types/lettrage';

interface CsvPaymentListProps {
  payments: CsvPayment[];
  matches: LettrageMatch[];
  searchQuery: string;
}

export function CsvPaymentList({ payments, matches, searchQuery }: CsvPaymentListProps) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const getPaymentMatch = (paymentId: string) => {
    return matches.find(match => match.paymentId === paymentId);
  };

  const filteredPayments = payments.filter(payment => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      payment.amount.toString().includes(query) ||
      payment.date.includes(query) ||
      payment.description?.toLowerCase().includes(query)
    );
  });

  const groupedPayments = {
    matched: filteredPayments.filter(p => p.isMatched),
    unmatched: filteredPayments.filter(p => !p.isMatched)
  };

  return (
    <div className="space-y-3 budget-container">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-fit-md font-semibold text-gray-900 flex items-center gap-2">
          💳 Paiements CSV ({filteredPayments.length})
        </h3>
        {searchQuery && (
          <div className="flex items-center gap-2 text-fit-xs text-gray-600">
            <Search className="w-3.5 h-3.5" />
            <span className="truncate">Filtré: "{searchQuery}"</span>
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-50/80 rounded-lg p-2 border border-green-200/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-fit-xs text-green-700">Assignés</p>
              <p className="text-fit-md font-bold text-green-900">{groupedPayments.matched.length}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div className="bg-orange-50/80 rounded-lg p-2 border border-orange-200/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-fit-xs text-orange-700">Libres</p>
              <p className="text-fit-md font-bold text-orange-900">{groupedPayments.unmatched.length}</p>
            </div>
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Liste des paiements */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-6 glass-panel rounded-xl">
            <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-fit-sm text-gray-500">
              {searchQuery ? 'Aucun paiement trouvé pour cette recherche' : 'Aucun paiement à afficher'}
            </p>
          </div>
        ) : (
          filteredPayments.map(payment => {
            const match = getPaymentMatch(payment.id);
            const isMatched = payment.isMatched;
            
            return (
              <div
                key={payment.id}
                className={`p-3 rounded-lg border transition-all budget-container ${
                  isMatched
                    ? 'border-green-200/80 bg-green-50/70'
                    : 'border-purple-200/80 bg-purple-50/70 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isMatched ? 'bg-green-200' : 'bg-purple-200'
                    }`}>
                      <CreditCard className={`w-4 h-4 ${
                        isMatched ? 'text-green-700' : 'text-purple-700'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-fit-sm font-semibold text-gray-900 truncate">
                        {payment.description || `Paiement ligne ${payment.originalRow}`}
                      </p>
                      <p className="text-fit-xs text-gray-600">
                        {new Date(payment.date).toLocaleDateString('fr-FR')}
                        <span className="ml-2 text-fit-xs bg-gray-200 px-2 py-0.5 rounded">
                          Ligne {payment.originalRow}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-2 justify-end">
                      <Banknote className={`w-3.5 h-3.5 ${
                        isMatched ? 'text-green-600' : 'text-purple-600'
                      }`} />
                      <p className="text-fit-sm font-bold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    
                    {isMatched && match && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 text-green-600 text-fit-xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Lettré
                        </span>
                        {match.difference > 0 && (
                          <p className="text-fit-xs text-orange-600">
                            Δ {formatCurrency(match.difference)}
                          </p>
                        )}
                      </div>
                    )}

                    {!isMatched && (
                      <span className="inline-flex items-center gap-1 text-purple-600 text-fit-xs">
                        <Clock className="w-3.5 h-3.5" />
                        Disponible
                      </span>
                    )}
                  </div>
                </div>

                {/* Information de matching pour les paiements assignés */}
                {isMatched && match && (
                  <div className="mt-2 pt-2 border-t border-green-200/70">
                    <div className="flex items-center gap-2 text-fit-xs text-green-700">
                      <span>→</span>
                      <span>Lié à la facture</span>
                      {match.isAutomatic && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-fit-xs">
                          Auto
                        </span>
                      )}
                      {!match.isAutomatic && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-fit-xs">
                          Manuel
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Résumé des montants */}
      {filteredPayments.length > 0 && (
        <div className="glass-panel rounded-lg p-3 border border-cyan-100/70">
          <h4 className="text-fit-sm font-semibold text-gray-900 mb-2">Résumé des montants</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-fit-xs">
            <div>
              <span className="text-gray-600">Total paiements</span>
              <span className="font-bold text-gray-900 ml-2">
                {formatCurrency(
                  filteredPayments.reduce((sum, p) => sum + p.amount, 0)
                )}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Montant assigné</span>
              <span className="font-bold text-green-600 ml-2">
                {formatCurrency(
                  groupedPayments.matched.reduce((sum, p) => sum + p.amount, 0)
                )}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Montant libre</span>
              <span className="font-bold text-purple-600 ml-2">
                {formatCurrency(
                  groupedPayments.unmatched.reduce((sum, p) => sum + p.amount, 0)
                )}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Moyenne</span>
              <span className="font-bold text-gray-900 ml-2">
                {formatCurrency(
                  filteredPayments.reduce((sum, p) => sum + p.amount, 0) / filteredPayments.length || 0
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
