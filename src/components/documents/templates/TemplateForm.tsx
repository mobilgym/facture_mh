import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { createTemplate, updateTemplate } from '@/lib/services/document/templateService';
import Button from '@/components/ui/Button';
import type { DocumentTemplate } from '@/types/document';

interface TemplateFormProps {
  initialTemplate?: Partial<DocumentTemplate>;
  type: 'invoice' | 'quote';
  onSuccess: () => void;
}

export default function TemplateForm({ initialTemplate, type, onSuccess }: TemplateFormProps) {
  const { selectedCompany } = useCompany();
  const [template, setTemplate] = useState(initialTemplate || {
    name: '',
    type,
    layout: {}
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      setLoading(true);
      if (initialTemplate?.id) {
        await updateTemplate(initialTemplate.id, template);
      } else {
        await createTemplate({
          ...template,
          companyId: selectedCompany.id,
          type
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nom du modèle</label>
        <input
          type="text"
          value={template.name || ''}
          onChange={(e) => setTemplate({ ...template, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      {/* Ici, ajoutez un éditeur de mise en page visuel */}
      <div className="border rounded-md p-4">
        <p className="text-sm text-gray-500">
          Éditeur de mise en page à implémenter
        </p>
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