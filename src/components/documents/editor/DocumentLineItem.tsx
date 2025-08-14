import React from 'react';
import { Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { DocumentItem } from '@/types/document';

interface DocumentLineItemProps {
  item: Partial<DocumentItem>;
  onChange: (updates: Partial<DocumentItem>) => void;
  onRemove: () => void;
}

export default function DocumentLineItem({ item, onChange, onRemove }: DocumentLineItemProps) {
  return (
    <div className="grid grid-cols-12 gap-4 items-start">
      <div className="col-span-6">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          value={item.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700">Quantité</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.quantity || ''}
          onChange={(e) => onChange({ quantity: parseFloat(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700">Prix unitaire</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice || ''}
          onChange={(e) => onChange({ unitPrice: parseFloat(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div className="col-span-1">
        <label className="block text-sm font-medium text-gray-700">Total</label>
        <div className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-50 rounded-md text-gray-500">
          {(item.total || 0).toFixed(2)} €
        </div>
      </div>
      <div className="col-span-1 pt-7">
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}