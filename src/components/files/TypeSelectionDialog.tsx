import React from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import Button from '@/components/ui/Button';

export type DocumentType = 'achat' | 'vente';

interface TypeSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: DocumentType) => void;
}

export default function TypeSelectionDialog({ isOpen, onClose, onSelect }: TypeSelectionDialogProps) {
  if (!isOpen) return null;

  const handleTypeSelect = (type: DocumentType) => {
    onSelect(type);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">Type de document</h2>
        
        <p className="text-gray-600 text-center mb-6">
          Sélectionnez le type de document que vous souhaitez importer :
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={() => handleTypeSelect('achat')}
            className="w-full flex items-center justify-center space-x-3 py-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="text-lg font-medium">Achat</span>
          </Button>
          
          <Button
            onClick={() => handleTypeSelect('vente')}
            className="w-full flex items-center justify-center space-x-3 py-4 bg-green-600 hover:bg-green-700 text-white"
          >
            <Package className="h-6 w-6" />
            <span className="text-lg font-medium">Vente</span>
          </Button>
        </div>
        
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}