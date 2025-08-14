import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { FileItem } from '@/types/file';

interface DeleteFileDialogProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export default function DeleteFileDialog({
  file,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}: DeleteFileDialogProps) {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-start space-x-3 mb-6">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Confirmer la suppression
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Cette action est irréversible
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer définitivement le fichier :
          </p>
          <p className="mt-2 font-medium text-gray-900 break-all">
            {file.name}
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Suppression...
              </span>
            ) : (
              'Supprimer'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}