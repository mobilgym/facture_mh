import React from 'react';
import { X, FileText, Calendar, Euro, Building, User, Hash } from 'lucide-react';
import type { FileItem } from '../../types/file';

interface InvoiceDetailsModalProps {
  invoice: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailsModal({ invoice, isOpen, onClose }: InvoiceDetailsModalProps) {
  if (!isOpen || !invoice) return null;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Détails de la facture</h2>
                <p className="text-sm text-gray-600">Informations complètes du document</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Informations principales */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📄 Document
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du fichier
                  </label>
                  <p className="text-gray-900 font-medium">{invoice.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <p className="text-gray-900">{invoice.type || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taille
                  </label>
                  <p className="text-gray-900">
                    {invoice.size ? `${(invoice.size / 1024).toFixed(1)} KB` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Créé le
                  </label>
                  <p className="text-gray-900">
                    {formatDate(invoice.created_at || '')}
                  </p>
                </div>
              </div>
            </div>

            {/* Informations financières */}
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                💰 Montant
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant
                  </label>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(invoice.amount || 0)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date du document
                  </label>
                  <p className="text-gray-900">
                    {formatDate(invoice.document_date || '')}
                  </p>
                </div>
              </div>
            </div>

            {/* Métadonnées */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🏷️ Métadonnées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Document
                  </label>
                  <p className="text-gray-900 font-mono text-sm">{invoice.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chemin de stockage
                  </label>
                  <p className="text-gray-900 text-sm break-all">{invoice.path || 'N/A'}</p>
                </div>
                {invoice.company_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Entreprise
                    </label>
                    <p className="text-gray-900 font-mono text-sm">{invoice.company_id}</p>
                  </div>
                )}
                {invoice.folder_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Dossier
                    </label>
                    <p className="text-gray-900 font-mono text-sm">{invoice.folder_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Informations de lettrage */}
            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🔗 Statut de lettrage
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    État
                  </label>
                  <div className="flex items-center gap-2">
                    {invoice.is_lettree ? (
                      <>
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span className="text-green-700 font-medium">Lettré</span>
                      </>
                    ) : (
                      <>
                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                        <span className="text-orange-700 font-medium">Non lettré</span>
                      </>
                    )}
                  </div>
                </div>
                {invoice.lettrage_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de lettrage
                    </label>
                    <p className="text-gray-900">
                      {formatDate(invoice.lettrage_date)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* URL d'accès (si disponible) */}
            {invoice.url && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  🔗 Accès au fichier
                </h3>
                <a
                  href={invoice.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Ouvrir le document
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Pied de page */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
