import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import type { FileItem } from '../../types/file';
import type { CsvPayment, LettrageMatch } from '../../types/lettrage';

interface LettrageCanvasProps {
  invoices: FileItem[];
  payments: CsvPayment[];
  matches: LettrageMatch[];
  onAddMatch: (invoiceId: string, paymentId: string) => void;
  onRemoveMatch: (matchId: string) => void;
  onInvoiceClick?: (invoice: FileItem) => void;
}

// Interfaces simplifiées - utilisation directe des types existants

export function LettrageCanvas({ invoices, payments, matches, onAddMatch, onRemoveMatch, onInvoiceClick }: LettrageCanvasProps) {
  // États simplifiés pour le mode liste uniquement
  const [isCompactView, setIsCompactView] = useState(false);





  // Gestion des clics sur les factures (simplifié pour le mode liste)
  const handleInvoiceClick = (invoice: FileItem) => {
    if (onInvoiceClick) {
      onInvoiceClick(invoice);
    }
  };

  const handleRemoveConnection = (connectionId: string) => {
    onRemoveMatch(connectionId);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    });
  };

  // Vue liste avec cordes visibles et alignement face-à-face
  const renderListView = () => {
    // Créer des paires facture-paiement pour l'alignement
    const createAlignedPairs = () => {
      const pairs: Array<{
        invoice?: FileItem;
        payment?: CsvPayment;
        match?: LettrageMatch;
        invoiceIndex?: number;
        paymentIndex?: number;
      }> = [];

      // D'abord, ajouter les paires lettrées (alignées)
      matches.forEach(match => {
        const invoice = invoices.find(inv => inv.id === match.invoiceId);
        const payment = payments.find(pay => pay.id === match.paymentId);
        if (invoice && payment) {
          pairs.push({
            invoice,
            payment,
            match,
            invoiceIndex: invoices.indexOf(invoice),
            paymentIndex: payments.indexOf(payment)
          });
        }
      });

      // Ensuite, ajouter les factures non lettrées
      const unmatchedInvoices = invoices.filter(inv => 
        !matches.some(m => m.invoiceId === inv.id)
      );
      unmatchedInvoices.forEach(invoice => {
        pairs.push({
          invoice,
          invoiceIndex: invoices.indexOf(invoice)
        });
      });

      // Enfin, ajouter les paiements non lettrés
      const unmatchedPayments = payments.filter(pay => 
        !matches.some(m => m.paymentId === pay.id)
      );
      unmatchedPayments.forEach(payment => {
        pairs.push({
          payment,
          paymentIndex: payments.indexOf(payment)
        });
      });

      return pairs;
    };

    const alignedPairs = createAlignedPairs();
    
    return (
      <div className="relative overflow-x-auto">
        <div className="min-w-[640px]">
        {/* En-têtes des colonnes */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          <div className="col-span-2">
            <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <span className="text-fit-xs">📄</span>
              <div>
                <div className="font-bold text-fit-xs">Factures</div>
                <div className="text-green-100 text-fit-xs">{invoices.length} document{invoices.length > 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 flex items-center justify-center">
            <div className="bg-gray-500 text-white px-2 py-1 rounded text-fit-xs">
              Cordes
            </div>
          </div>
          
          <div className="col-span-2">
            <div className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <span className="text-fit-xs">💳</span>
              <div>
                <div className="font-bold text-fit-xs">Paiements</div>
                <div className="text-blue-100 text-fit-xs">{payments.length} paiement{payments.length > 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Paires alignées */}
        <div className="space-y-2">
          {alignedPairs.map((pair, index) => (
            <div key={`pair-${index}`} className="grid grid-cols-5 gap-2 items-center">
              {/* Facture */}
              <div className="col-span-2">
                {pair.invoice ? (
                  <div 
                    className={`relative bg-gradient-to-r from-green-50/80 to-green-100/80 border border-green-300 rounded-lg p-2 pb-5 cursor-pointer hover:shadow-lg transition-all ${
                      pair.match ? 'ring-2 ring-green-400 ring-opacity-50' : ''
                    }`}
                    onClick={() => handleInvoiceClick(pair.invoice!)}
                    style={{ minHeight: '68px' }}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'invoice',
                        id: pair.invoice!.id,
                        amount: pair.invoice!.amount || 0
                      }));
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data.type === 'payment' && !pair.match) {
                        onAddMatch(pair.invoice!.id, data.id);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-1 relative">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-fit-xs">📄</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-green-800 text-fit-xs truncate">{formatCurrency(pair.invoice.amount || 0)}</div>
                          <div className="text-gray-600 text-fit-xs">{formatDate(pair.invoice.document_date || '')}</div>
                        </div>
                      </div>
                      <div className="text-gray-500 text-fit-xs truncate" title={pair.invoice.name}>
                        {pair.invoice.name}
                      </div>
                      
                      {/* Icônes en bas à droite */}
                      <div className="absolute bottom-1 right-1 flex items-center gap-1">
                        {/* Icône de lettrage validé si lettré */}
                        {pair.match && (
                          <div className="w-3.5 h-3.5 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-sm border border-green-300" title="Lettrage validé">
                            <span className="text-white text-fit-xs">🔗</span>
                          </div>
                        )}
                        {/* Icône de détails */}
                        <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm" title="Voir détails">
                          <span className="text-white text-fit-xs">👁</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[68px] bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-fit-xs">Pas de facture</span>
                  </div>
                )}
              </div>

              {/* Espace central pour corde */}
              <div className="col-span-1 flex justify-center items-center relative" style={{ minHeight: '68px' }}>
                {pair.match && (
                  <div className="relative flex items-center">
                    {/* Corde */}
                    <div className="w-16 h-1 bg-gradient-to-r from-green-500 via-cyan-500 to-blue-500 rounded-full shadow-sm"></div>
                    
                    {/* Icône de détachement discrète */}
                    <div
                      onClick={() => handleRemoveConnection(pair.match!.id)}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-600 hover:bg-red-600 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors opacity-70 hover:opacity-100 shadow-sm"
                      title="Détacher cette connexion"
                    >
                      <span className="text-fit-xs leading-none">×</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Paiement */}
              <div className="col-span-2">
                {pair.payment ? (
                  <div 
                    className={`relative bg-gradient-to-l from-blue-50/80 to-blue-100/80 border border-blue-300 rounded-lg p-2 pb-5 transition-all ${
                      pair.match ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                    }`}
                    style={{ minHeight: '68px' }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data.type === 'invoice' && !pair.match) {
                        onAddMatch(data.id, pair.payment!.id);
                      }
                    }}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'payment',
                        id: pair.payment!.id,
                        amount: pair.payment!.amount
                      }));
                    }}
                  >
                    <div className="flex flex-col gap-1 relative">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-fit-xs">💳</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-blue-800 text-fit-xs truncate">{formatCurrency(pair.payment.amount)}</div>
                          <div className="text-gray-600 text-fit-xs">{formatDate(pair.payment.date)}</div>
                        </div>
                      </div>
                      <div className="text-gray-500 text-fit-xs truncate" title={pair.payment.description || 'Paiement'}>
                        {pair.payment.description || 'Paiement'}
                      </div>
                      
                      {/* Icônes en bas à droite */}
                      <div className="absolute bottom-1 right-1 flex items-center gap-1">
                        {/* Badge multi-connexions */}
                        {(() => {
                          const connectedMatches = matches.filter(m => m.paymentId === pair.payment!.id);
                          return connectedMatches.length > 1 && (
                            <div className="w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center shadow-sm" title={`${connectedMatches.length} connexions`}>
                              <span className="text-white text-fit-xs font-bold">{connectedMatches.length}</span>
                            </div>
                          );
                        })()}
                        {/* Icône de lettrage validé si lettré */}
                        {pair.match && (
                          <div className="w-3.5 h-3.5 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-sm border border-green-300" title="Lettrage validé">
                            <span className="text-white text-fit-xs">🔗</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[68px] bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-fit-xs">Pas de paiement</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucune donnée */}
        {alignedPairs.length === 0 && (
          <div className="text-center py-8">
            <Zap className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <h4 className="text-fit-md font-semibold text-gray-900 mb-2">Aucune donnée à afficher</h4>
            <p className="text-fit-sm text-gray-600">Importez votre CSV et chargez les factures pour commencer</p>
          </div>
        )}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4 border border-cyan-100/70 budget-container">
      {/* En-tête simplifié */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <div>
          <h3 className="text-fit-md font-semibold text-gray-900">🎯 Interface de Lettrage</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompactView(!isCompactView)}
            className={`px-3 py-1 rounded-full text-fit-xs font-semibold transition-colors ${
              isCompactView 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/80 text-gray-600 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            Compact
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="mb-4">
        {renderListView()}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2 text-center text-fit-xs">
        <div className="bg-white/80 rounded-lg p-2 border border-gray-200">
          <div className="text-fit-md font-bold text-red-600">
            {invoices.filter(inv => !matches.some(m => m.invoiceId === inv.id)).length}
          </div>
          <div className="text-gray-600">Factures libres</div>
        </div>
        <div className="bg-white/80 rounded-lg p-2 border border-gray-200">
          <div className="text-fit-md font-bold text-purple-600">
            {payments.filter(pay => !matches.some(m => m.paymentId === pay.id)).length}
          </div>
          <div className="text-gray-600">Paiements libres</div>
        </div>
        <div className="bg-white/80 rounded-lg p-2 border border-gray-200">
          <div className="text-fit-md font-bold text-green-600">
            {matches.length}
          </div>
          <div className="text-gray-600">Connexions</div>
        </div>
      </div>
    </div>
  );
}
