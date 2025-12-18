import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Eye, FileText, CreditCard } from 'lucide-react';
import type { LettrageMatch, CsvPayment } from '../../types/lettrage';
import type { FileItem } from '../../types/file';

interface LettragePreviewProps {
  matches: LettrageMatch[];
  invoices: FileItem[];
  payments: CsvPayment[];
  onValidate: () => void;
  onCancel: () => void;
  onInvoiceClick?: (invoice: FileItem) => void;
}

export function LettragePreview({ matches, invoices, payments, onValidate, onCancel, onInvoiceClick }: LettragePreviewProps) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const getMatchDetails = (match: LettrageMatch) => {
    const invoice = invoices.find(inv => inv.id === match.invoiceId);
    const payment = payments.find(pay => pay.id === match.paymentId);
    return { invoice, payment };
  };

  const categorizeMatches = () => {
    const perfect = matches.filter(m => m.difference === 0);
    const good = matches.filter(m => m.difference > 0 && m.difference <= 5);
    const warning = matches.filter(m => m.difference > 5 && m.difference <= 50);
    const problematic = matches.filter(m => m.difference > 50);

    return { perfect, good, warning, problematic };
  };

  const { perfect, good, warning, problematic } = categorizeMatches();
  
  const totalMatched = matches.reduce((sum, match) => sum + match.invoiceAmount, 0);
  const totalDifference = matches.reduce((sum, match) => sum + match.difference, 0);

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 glass-panel rounded-2xl">
        <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-fit-md font-semibold text-gray-900 mb-2">
          Aucune correspondance à prévisualiser
        </h3>
        <p className="text-fit-sm text-gray-600">
          Créez des correspondances avant de voir l'aperçu
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 budget-container">
      {/* En-tête avec résumé */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/70 rounded-xl p-4 border border-blue-200/70">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h3 className="text-fit-lg font-semibold text-gray-900 flex items-center gap-2">
            👁️ Aperçu du lettrage
          </h3>
          <span className="text-fit-sm font-semibold text-blue-700">
            {matches.length} correspondance{matches.length > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/80 rounded-lg p-3 border border-blue-200/70 min-w-0">
            <div className="text-fit-md font-bold text-green-600 truncate">
              {formatCurrency(totalMatched)}
            </div>
            <div className="text-fit-xs text-gray-600">Montant total à lettrer</div>
          </div>
          <div className="bg-white/80 rounded-lg p-3 border border-blue-200/70 min-w-0">
            <div className="text-fit-md font-bold text-orange-600 truncate">
              {formatCurrency(totalDifference)}
            </div>
            <div className="text-fit-xs text-gray-600">Différence cumulée</div>
          </div>
          <div className="bg-white/80 rounded-lg p-3 border border-blue-200/70 min-w-0">
            <div className="text-fit-md font-bold text-blue-600 truncate">
              {((perfect.length + good.length) / matches.length * 100).toFixed(0)}%
            </div>
            <div className="text-fit-xs text-gray-600">Correspondances fiables</div>
          </div>
        </div>
      </div>

      {/* Catégorisation des correspondances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Correspondances parfaites */}
        {perfect.length > 0 && (
          <div className="bg-white/80 rounded-xl border border-green-200/70 overflow-hidden">
            <div className="bg-green-50/80 px-3 py-2 border-b border-green-200/70">
              <h4 className="text-fit-sm font-semibold text-green-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Parfaites ({perfect.length})
              </h4>
              <p className="text-fit-xs text-green-700">Montants identiques</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {perfect.map(match => {
                const { invoice, payment } = getMatchDetails(match);
                return (
                  <div key={match.id} className="p-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div 
                        className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => invoice && onInvoiceClick?.(invoice)}
                        title="Cliquer pour voir les détails de la facture"
                      >
                        <FileText className="w-4 h-4 text-green-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-fit-sm font-semibold text-gray-900 flex items-center gap-2 truncate">
                            <span className="truncate">{invoice?.name}</span>
                            <span className="text-fit-xs text-blue-600">🔍</span>
                          </p>
                          <p className="text-fit-xs text-gray-600">
                            {invoice?.document_date ? new Date(invoice.document_date).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="text-fit-sm font-bold text-green-600">
                          ↔️
                        </div>
                        <div className="text-fit-xs text-gray-500">Δ 0€</div>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-right min-w-0">
                          <p className="text-fit-sm font-semibold text-gray-900 truncate">{payment?.description}</p>
                          <p className="text-fit-xs text-gray-600">
                            {payment?.date ? new Date(payment.date).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                        <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-fit-sm font-bold text-gray-900">
                        {formatCurrency(match.invoiceAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Correspondances bonnes */}
        {good.length > 0 && (
          <div className="bg-white/80 rounded-xl border border-blue-200/70 overflow-hidden">
            <div className="bg-blue-50/80 px-3 py-2 border-b border-blue-200/70">
              <h4 className="text-fit-sm font-semibold text-blue-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Bonnes ({good.length})
              </h4>
              <p className="text-fit-xs text-blue-700">Différence ≤ 5€</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {good.map(match => {
                const { invoice, payment } = getMatchDetails(match);
                return (
                  <div key={match.id} className="p-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div 
                        className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => invoice && onInvoiceClick?.(invoice)}
                        title="Cliquer pour voir les détails de la facture"
                      >
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-fit-sm font-semibold text-gray-900 flex items-center gap-2 truncate">
                            <span className="truncate">{invoice?.name}</span>
                            <span className="text-fit-xs text-blue-600">🔍</span>
                          </p>
                          <p className="text-fit-xs text-gray-600">
                            {invoice?.document_date ? new Date(invoice.document_date).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="text-fit-sm font-bold text-blue-600">
                          ↔️
                        </div>
                        <div className="text-fit-xs text-blue-600">
                          Δ {formatCurrency(match.difference)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-right min-w-0">
                          <p className="text-fit-sm font-semibold text-gray-900 truncate">{payment?.description}</p>
                          <p className="text-fit-xs text-gray-600">
                            {payment?.date ? new Date(payment.date).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                        <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap justify-center gap-4">
                      <span className="text-fit-xs text-gray-600">
                        F: {formatCurrency(match.invoiceAmount)}
                      </span>
                      <span className="text-fit-xs text-gray-600">
                        P: {formatCurrency(match.paymentAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Correspondances à vérifier */}
        {warning.length > 0 && (
          <div className="bg-white/80 rounded-xl border border-amber-200/70 overflow-hidden">
            <div className="bg-amber-50/80 px-3 py-2 border-b border-amber-200/70">
              <h4 className="text-fit-sm font-semibold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                À vérifier ({warning.length})
              </h4>
              <p className="text-fit-xs text-amber-700">Différence 5€ - 50€</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {warning.map(match => {
                const { invoice, payment } = getMatchDetails(match);
                return (
                  <div key={match.id} className="p-3 border-b border-gray-100 last:border-b-0 bg-amber-25">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div 
                        className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-amber-50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => invoice && onInvoiceClick?.(invoice)}
                        title="Cliquer pour voir les détails de la facture"
                      >
                        <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-fit-sm font-semibold text-gray-900 flex items-center gap-2 truncate">
                            <span className="truncate">{invoice?.name}</span>
                            <span className="text-fit-xs text-blue-600">🔍</span>
                          </p>
                          <p className="text-fit-xs text-gray-600">
                            {invoice?.document_date ? new Date(invoice.document_date).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="text-fit-sm font-bold text-amber-600">
                          ⚠️
                        </div>
                        <div className="text-fit-xs text-amber-600 font-medium">
                          Δ {formatCurrency(match.difference)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-right min-w-0">
                          <p className="text-fit-sm font-semibold text-gray-900 truncate">{payment?.description}</p>
                          <p className="text-fit-xs text-gray-600">
                            {payment?.date ? new Date(payment.date).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                        <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap justify-center gap-4">
                      <span className="text-fit-xs text-gray-600">
                        F: {formatCurrency(match.invoiceAmount)}
                      </span>
                      <span className="text-fit-xs text-gray-600">
                        P: {formatCurrency(match.paymentAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Correspondances problématiques */}
        {problematic.length > 0 && (
          <div className="bg-white/80 rounded-xl border border-red-200/70 overflow-hidden">
            <div className="bg-red-50/80 px-3 py-2 border-b border-red-200/70">
              <h4 className="text-fit-sm font-semibold text-red-900 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Problématiques ({problematic.length})
              </h4>
              <p className="text-fit-xs text-red-700">Différence &gt; 50€</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {problematic.map(match => {
                const { invoice, payment } = getMatchDetails(match);
                return (
                  <div key={match.id} className="p-3 border-b border-gray-100 last:border-b-0 bg-red-25">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div 
                        className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-red-50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => invoice && onInvoiceClick?.(invoice)}
                        title="Cliquer pour voir les détails de la facture"
                      >
                        <FileText className="w-4 h-4 text-red-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-fit-sm font-semibold text-gray-900 flex items-center gap-2 truncate">
                            <span className="truncate">{invoice?.name}</span>
                            <span className="text-fit-xs text-blue-600">🔍</span>
                          </p>
                          <p className="text-fit-xs text-gray-600">
                            {invoice?.document_date ? new Date(invoice.document_date).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="text-fit-sm font-bold text-red-600">
                          ❌
                        </div>
                        <div className="text-fit-xs text-red-600 font-bold">
                          Δ {formatCurrency(match.difference)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-right min-w-0">
                          <p className="text-fit-sm font-semibold text-gray-900 truncate">{payment?.description}</p>
                          <p className="text-fit-xs text-gray-600">
                            {payment?.date ? new Date(payment.date).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                        <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap justify-center gap-4">
                      <span className="text-fit-xs text-gray-600">
                        F: {formatCurrency(match.invoiceAmount)}
                      </span>
                      <span className="text-fit-xs text-gray-600">
                        P: {formatCurrency(match.paymentAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Actions de validation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gray-50/80 rounded-xl p-4 border border-gray-200">
        <div className="min-w-0">
          <h4 className="text-fit-sm font-semibold text-gray-900 mb-1">
            Êtes-vous sûr de vouloir valider ces correspondances ?
          </h4>
          <p className="text-fit-xs text-gray-600">
            Cette action sera irréversible. Les factures seront marquées comme lettrées.
          </p>
          {problematic.length > 0 && (
            <p className="text-fit-xs text-red-600 mt-1">
              ⚠️ {problematic.length} correspondance{problematic.length > 1 ? 's' : ''} problématique{problematic.length > 1 ? 's' : ''} détectée{problematic.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-full text-fit-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onValidate}
            className={`px-4 py-2 rounded-full text-fit-xs text-white transition-colors flex items-center gap-2 ${
              problematic.length > 0
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Valider {matches.length} correspondance{matches.length > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
