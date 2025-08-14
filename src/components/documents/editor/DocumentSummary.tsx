import React from 'react';

interface DocumentSummaryProps {
  totals: {
    subtotal: number;
  };
}

export default function DocumentSummary({ totals }: DocumentSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Sous-total</span>
          <span className="font-medium">{totals.subtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Total</span>
          <span className="text-lg font-bold">{totals.subtotal.toFixed(2)} €</span>
        </div>
      </div>
    </div>
  );
}