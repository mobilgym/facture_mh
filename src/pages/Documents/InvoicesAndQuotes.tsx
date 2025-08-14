import React, { useState } from 'react';
import { FileText, FilePlus, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import CompanySettingsForm from '@/components/documents/settings/CompanySettingsForm';
import TemplateForm from '@/components/documents/templates/TemplateForm';
import DocumentEditor from '@/components/documents/editor/DocumentEditor';
import ClientList from '@/components/clients/ClientList';
import ClientForm from '@/components/clients/ClientForm';
import { useCompany } from '@/contexts/CompanyContext';
import { useClients } from '@/hooks/useClients';
import { deleteClient } from '@/lib/services/clientService';
import type { Client } from '@/types/client';

type DocumentType = 'invoice' | 'quote';
type View = 'list' | 'create' | 'settings' | 'templates' | 'clients' | 'create-client' | 'edit-client';

export default function InvoicesAndQuotes() {
  const { selectedCompany } = useCompany();
  const { clients, loading: loadingClients, refetch: refetchClients } = useClients();
  const [documentType, setDocumentType] = useState<DocumentType>('invoice');
  const [view, setView] = useState<View>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleDeleteClient = async (client: Client) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
    
    try {
      await deleteClient(client.id);
      await refetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {view === 'clients' ? 'Clients' : documentType === 'invoice' ? 'Factures' : 'Devis'}
            </h1>
            <div className="flex items-center space-x-4">
              {view !== 'clients' && (
                <div className="flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setDocumentType('invoice')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                      documentType === 'invoice'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Factures
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentType('quote')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                      documentType === 'quote'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Devis
                  </button>
                </div>
              )}
              <Button 
                onClick={() => setView(view === 'clients' ? 'create-client' : 'create')}
              >
                {view === 'clients' ? (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Nouveau client
                  </>
                ) : (
                  <>
                    <FilePlus className="h-4 w-4 mr-2" />
                    Créer
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Navigation secondaire */}
          <nav className="mt-4">
            <ul className="flex space-x-4 border-b border-gray-200">
              <li>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    view === 'list'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Liste
                </button>
              </li>
              <li>
                <button
                  onClick={() => setView('clients')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    view === 'clients' || view === 'create-client' || view === 'edit-client'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Clients
                </button>
              </li>
              <li>
                <button
                  onClick={() => setView('templates')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    view === 'templates'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Modèles
                </button>
              </li>
              <li>
                <button
                  onClick={() => setView('settings')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    view === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Paramètres
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-lg shadow">
          {view === 'list' && (
            <div className="p-6">
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par créer votre premier {documentType === 'invoice' ? 'facture' : 'devis'}.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setView('create')}>
                    <FilePlus className="h-4 w-4 mr-2" />
                    Créer un {documentType === 'invoice' ? 'facture' : 'devis'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {view === 'create' && (
            <div className="p-6">
              <DocumentEditor
                type={documentType}
                onSuccess={() => setView('list')}
              />
            </div>
          )}

          {view === 'clients' && (
            <div className="p-6">
              {loadingClients ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded" />
                  ))}
                </div>
              ) : (
                <ClientList
                  clients={clients}
                  onEdit={(client) => {
                    setSelectedClient(client);
                    setView('edit-client');
                  }}
                  onDelete={handleDeleteClient}
                />
              )}
            </div>
          )}

          {(view === 'create-client' || view === 'edit-client') && (
            <div className="p-6">
              <ClientForm
                initialClient={view === 'edit-client' ? selectedClient : undefined}
                onSuccess={() => {
                  refetchClients();
                  setView('clients');
                }}
                onCancel={() => setView('clients')}
              />
            </div>
          )}

          {view === 'templates' && (
            <div className="p-6">
              <TemplateForm
                type={documentType}
                onSuccess={() => setView('list')}
              />
            </div>
          )}

          {view === 'settings' && (
            <div className="p-6">
              <CompanySettingsForm
                onSuccess={() => setView('list')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}