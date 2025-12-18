import React from 'react';
import { LettrageInterface } from '../components/lettrage/LettrageInterface';

export default function Lettrage() {
  return (
    <div className="min-h-screen bg-gray-50 app-page budget-container">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-fit-xl font-semibold text-gray-900 mb-2 tracking-tight">
            💰 Lettrage Automatique
          </h1>
          <p className="text-fit-sm text-gray-600">
            Réconciliez automatiquement vos factures avec vos paiements CSV
          </p>
        </div>
        
        <LettrageInterface />
      </div>
    </div>
  );
}
