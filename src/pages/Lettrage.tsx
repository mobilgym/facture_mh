import React from 'react';
import { LettrageInterface } from '../components/lettrage/LettrageInterface';

export default function Lettrage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💰 Lettrage Automatique
          </h1>
          <p className="text-lg text-gray-600">
            Réconciliez automatiquement vos factures avec vos paiements CSV
          </p>
        </div>
        
        <LettrageInterface />
      </div>
    </div>
  );
}
