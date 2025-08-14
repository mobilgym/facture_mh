import React, { useState } from 'react';
import { Plus, Save, Send } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { createInvoice, createQuote } from '@/lib/services/document/documentService';
import Button from '@/components/ui/Button';
import DocumentLineItem from './DocumentLineItem';
import DocumentSummary from './DocumentSummary';
import ClientInfoForm from './ClientInfoForm';
import type { DocumentItem } from '@/types/document';

interface DocumentEditorProps {
  type: 'invoice' | 'quote';
  onSuccess: () => void;
}

export default function DocumentEditor({ type, onSuccess }: DocumentEditorProps) {
  const { selectedCompany } = useCompany();
  const [items, setItems] = useState<Partial<DocumentItem>[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    address: '',
    email: ''
  });

  const addItem = () => {
    setItems([...items, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }]);
  };

  const updateItem = (index: number, updates: Partial<DocumentItem>) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      ...updates,
      total: calculateItemTotal(newItems[index])
    };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: Partial<DocumentItem>): number => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const taxRate = item.taxRate || 0;
    const discountRate = item.discountRate || 0;

    const subtotal = quantity * unitPrice;
    const discount = subtotal * (discountRate / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (taxRate / 100);

    return afterDiscount + tax;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    return { subtotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      setLoading(true);
      const { subtotal } = calculateTotals();

      const documentData = {
        companyId: selectedCompany.id,
        number: `${type === 'invoice' ? 'FACT' : 'DEV'}-${Date.now()}`,
        clientName: clientInfo.name,
        clientAddress: clientInfo.address,
        clientEmail: clientInfo.email,
        issueDate: new Date(),
        ...(type === 'invoice' 
          ? { dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
          : { validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        ),
        subtotal,
        total: subtotal,
        status: 'draft'
      };

      if (type === 'invoice') {
        await createInvoice(documentData);
      } else {
        await createQuote(documentData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ClientInfoForm
        clientInfo={clientInfo}
        onChange={setClientInfo}
      />

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Prestations</h3>
          <Button type="button" onClick={addItem} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une prestation
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <DocumentLineItem
              key={index}
              item={item}
              onChange={(updates) => updateItem(index, updates)}
              onRemove={() => removeItem(index)}
            />
          ))}
        </div>
      </div>

      <DocumentSummary totals={calculateTotals()} />

      <div className="flex justify-end space-x-4">
        <Button type="submit" variant="outline" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Enregistrer le brouillon
        </Button>
        <Button type="button" disabled={loading}>
          <Send className="h-4 w-4 mr-2" />
          Envoyer
        </Button>
      </div>
    </form>
  );
}