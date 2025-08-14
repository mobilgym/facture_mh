import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { createClient, updateClient } from '@/lib/services/clientService';
import Button from '@/components/ui/Button';
import type { Client } from '@/types/client';

interface ClientFormProps {
  initialClient?: Partial<Client>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ClientForm({ initialClient, onSuccess, onCancel }: ClientFormProps) {
  const { selectedCompany } = useCompany();
  const [client, setClient] = useState(initialClient || {});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      setLoading(true);
      if (initialClient?.id) {
        await updateClient(initialClient.id, client);
      } else {
        await createClient({
          ...client,
          companyId: selectedCompany.id
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            type="text"
            value={client.name || ''}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={client.email || ''}
            onChange={(e) => setClient({ ...client, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input
            type="tel"
            value={client.phone || ''}
            onChange={(e) => setClient({ ...client, phone: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Adresse</label>
          <textarea
            value={client.address || ''}
            onChange={(e) => setClient({ ...client, address: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">SIRET</label>
          <input
            type="text"
            value={client.siret || ''}
            onChange={(e) => setClient({ ...client, siret: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Numéro de TVA</label>
          <input
            type="text"
            value={client.vatNumber || ''}
            onChange={(e) => setClient({ ...client, vatNumber: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={client.notes || ''}
            onChange={(e) => setClient({ ...client, notes: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}