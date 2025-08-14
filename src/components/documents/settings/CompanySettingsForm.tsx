import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { updateCompanySettings } from '@/lib/services/document/companySettingsService';
import Button from '@/components/ui/Button';
import type { CompanySettings } from '@/types/document';

interface CompanySettingsFormProps {
  initialSettings?: Partial<CompanySettings>;
  onSuccess: () => void;
}

export default function CompanySettingsForm({ initialSettings, onSuccess }: CompanySettingsFormProps) {
  const { selectedCompany } = useCompany();
  const [settings, setSettings] = useState(initialSettings || {});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      setLoading(true);
      await updateCompanySettings({
        ...settings,
        companyId: selectedCompany.id
      });
      onSuccess();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Logo</label>
          <input
            type="url"
            value={settings.logoUrl || ''}
            onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="URL du logo"
          />
        </div>

        {/* Couleurs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Couleur principale</label>
            <input
              type="color"
              value={settings.primaryColor || '#000000'}
              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Couleur secondaire</label>
            <input
              type="color"
              value={settings.secondaryColor || '#000000'}
              onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
              className="mt-1 block w-full"
            />
          </div>
        </div>

        {/* Informations légales */}
        <div>
          <label className="block text-sm font-medium text-gray-700">SIRET</label>
          <input
            type="text"
            value={settings.siret || ''}
            onChange={(e) => setSettings({ ...settings, siret: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Numéro de TVA</label>
          <input
            type="text"
            value={settings.vatNumber || ''}
            onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Adresse légale</label>
          <textarea
            value={settings.legalAddress || ''}
            onChange={(e) => setSettings({ ...settings, legalAddress: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Modalités de paiement */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Détails de paiement</label>
          <textarea
            value={settings.paymentDetails || ''}
            onChange={(e) => setSettings({ ...settings, paymentDetails: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* CGV */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Conditions générales de vente</label>
          <textarea
            value={settings.termsAndConditions || ''}
            onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
            rows={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Préfixe des documents */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Préfixe des documents</label>
          <input
            type="text"
            value={settings.documentPrefix || ''}
            onChange={(e) => setSettings({ ...settings, documentPrefix: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Ex: FACT-"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}