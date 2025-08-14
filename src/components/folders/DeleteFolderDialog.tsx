import React from 'react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import type { Folder } from '@/types/file';

interface DeleteFolderDialogProps {
  folder: Folder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteFolderDialog({ folder, isOpen, onClose, onSuccess }: DeleteFolderDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: err } = await supabase
        .from('folders')
        .delete()
        .eq('id', folder.id);

      if (err) throw err;
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('Erreur lors de la suppression du dossier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Supprimer le dossier</h2>
        
        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer le dossier "{folder.name}" et tous ses fichiers ? Cette action est irréversible.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </div>
  );
}