import React, { useState } from 'react';
import { FileText, Calendar, DollarSign, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface VteInvoice {
  id: string;
  name: string;
  amount: number;
  document_date: string;
  url?: string;
}

interface VteInvoicesListProps {
  invoices: VteInvoice[];
  totalAmount: number;
  className?: string;
}

export function VteInvoicesList({ invoices, totalAmount, className = '' }: VteInvoicesListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const displayedInvoices = showAll ? invoices : invoices.slice(0, 5);
  const hasMoreInvoices = invoices.length > 5;

  if (invoices.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 text-purple-600 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">Factures VTE</h4>
        </div>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucune facture VTE trouvée</p>
          <p className="text-sm text-gray-500 mt-1">
            Les factures avec préfixe "VTE_" ou "Vte_" apparaîtront ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* En-tête avec bouton d'expansion */}
      <div 
        className="flex items-center justify-between p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-purple-600 mr-2" />
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Factures VTE</h4>
            <p className="text-sm text-gray-600">
              {invoices.length} facture{invoices.length > 1 ? 's' : ''} • {formatAmount(totalAmount)}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="text-right mr-4">
            <div className="text-lg font-semibold text-purple-600">
              {formatAmount(totalAmount)}
            </div>
            <div className="text-sm text-gray-500">
              Total VTE
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Liste des factures (collapsible) */}
      {isExpanded && (
        <div className="p-6">
          <div className="space-y-3">
            {displayedInvoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center flex-1">
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {invoice.name}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(invoice.document_date)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="text-right mr-4">
                    <div className="font-semibold text-gray-900 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatAmount(invoice.amount)}
                    </div>
                  </div>
                  
                  {invoice.url && (
                    <button
                      onClick={() => window.open(invoice.url, '_blank')}
                      className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                      title="Ouvrir la facture"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bouton "Voir plus/moins" */}
          {hasMoreInvoices && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                {showAll 
                  ? `Voir moins` 
                  : `Voir les ${invoices.length - 5} autres factures`
                }
              </button>
            </div>
          )}

          {/* Résumé au bas */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Total des factures VTE:
              </span>
              <span className="text-lg font-bold text-purple-600">
                {formatAmount(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
