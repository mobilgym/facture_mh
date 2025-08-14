import React, { useState, useMemo } from 'react';
import { Eye, Download, FileText, Edit3, Save, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '@/components/ui/Button';
import type { SubmittedInvoice } from '@/types/invoice';

interface SubmittedInvoicesListProps {
  invoices: SubmittedInvoice[];
  onUpdateInvoice?: (invoiceId: string, updates: Partial<SubmittedInvoice>) => void;
}

interface EditingState {
  id: string;
  field: 'amount' | 'title';
  value: string;
}

export default function SubmittedInvoicesList({ invoices, onUpdateInvoice }: SubmittedInvoicesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<EditingState | null>(null);

  // Recherche intelligente
  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return invoices;

    const term = searchTerm.toLowerCase();
    return invoices.filter(invoice => {
      // Recherche par nom
      const fullName = `${invoice.first_name} ${invoice.last_name}`.toLowerCase();
      if (fullName.includes(term)) return true;

      // Recherche par organisation
      if (invoice.organization?.toLowerCase().includes(term)) return true;

      // Recherche par email
      if (invoice.email?.toLowerCase().includes(term)) return true;

      // Recherche par montant (si disponible)
      if (invoice.amount && invoice.amount.toString().includes(term)) return true;

      // Recherche par date
      const dateStr = format(new Date(invoice.document_date), 'dd/MM/yyyy');
      if (dateStr.includes(term)) return true;

      // Recherche par nom de fichier
      if (invoice.file_name?.toLowerCase().includes(term)) return true;

      return false;
    });
  }, [invoices, searchTerm]);

  const handleEdit = (id: string, field: 'amount' | 'title', currentValue: string) => {
    setEditing({ id, field, value: currentValue });
  };

  const handleSave = () => {
    if (!editing || !onUpdateInvoice) return;

    const updates: Partial<SubmittedInvoice> = {};
    if (editing.field === 'amount') {
      const numericValue = parseFloat(editing.value);
      if (!isNaN(numericValue)) {
        updates.amount = numericValue;
      }
    } else if (editing.field === 'title') {
      updates.file_name = editing.value;
    }

    onUpdateInvoice(editing.id, updates);
    setEditing(null);
  };

  const handleCancel = () => {
    setEditing(null);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher par nom, organisation, email, montant ou date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Liste responsive */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {/* Vue desktop */}
        <div className="hidden lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 hover:shadow-sm transition-all duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        {editing?.id === invoice.id && editing.field === 'title' ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                            <Button 
                              size="sm" 
                              onClick={handleSave}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              title="Sauvegarder"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={handleCancel}
                              className="hover:bg-red-50 hover:text-red-600"
                              title="Annuler"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center group">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {invoice.file_name || 'Document sans nom'}
                            </span>
                                                    {onUpdateInvoice && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(invoice.id, 'title', invoice.file_name || '')}
                            className="ml-2 opacity-60 group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 transition-all duration-200 border border-transparent hover:border-blue-200"
                            title="Modifier le titre"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.first_name} {invoice.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{invoice.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.organization}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editing?.id === invoice.id && editing.field === 'amount' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          className="w-24 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          title="Sauvegarder"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={handleCancel}
                          className="hover:bg-red-50 hover:text-red-600"
                          title="Annuler"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center group">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.amount)}
                        </span>
                        {onUpdateInvoice && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(invoice.id, 'amount', invoice.amount?.toString() || '0')}
                            className="ml-2 opacity-60 group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 transition-all duration-200 border border-transparent hover:border-blue-200"
                            title="Modifier le montant"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {format(new Date(invoice.document_date), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(invoice.file_url, '_blank')}
                        className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                        title="Visualiser"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = invoice.file_url;
                          link.download = invoice.file_name || 'document';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="hover:bg-green-50 hover:text-green-600 transition-all duration-200"
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vue mobile/tablet */}
        <div className="lg:hidden divide-y divide-gray-200">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="p-4 space-y-3">
              {/* Titre du document */}
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {editing?.id === invoice.id && editing.field === 'title' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {invoice.file_name || 'Document sans nom'}
                      </h3>
                      {onUpdateInvoice && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(invoice.id, 'title', invoice.file_name || '')}
                          className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                          title="Modifier le titre"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Informations client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Client:</span>
                  <div className="font-medium text-gray-900">
                    {invoice.first_name} {invoice.last_name}
                  </div>
                  <div className="text-gray-500">{invoice.email}</div>
                </div>
                <div>
                  <span className="text-gray-500">Organisation:</span>
                  <div className="text-gray-900">{invoice.organization}</div>
                </div>
              </div>

              {/* Montant et date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Montant:</span>
                  <div className="mt-1">
                    {editing?.id === invoice.id && editing.field === 'amount' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          className="w-24 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          title="Sauvegarder"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={handleCancel}
                          className="hover:bg-red-50 hover:text-red-600"
                          title="Annuler"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-lg text-gray-900">
                          {formatCurrency(invoice.amount)}
                        </span>
                        {onUpdateInvoice && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(invoice.id, 'amount', invoice.amount?.toString() || '0')}
                            className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                            title="Modifier le montant"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <div className="text-gray-900">
                    {format(new Date(invoice.document_date), 'dd MMMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(invoice.file_url, '_blank')}
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = invoice.file_url;
                    link.download = invoice.file_name || 'document';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Message vide */}
        {filteredInvoices.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'Aucun résultat trouvé' : 'Aucun document'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Essayez de modifier votre recherche.'
                : 'Aucun document disponible pour le moment.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}