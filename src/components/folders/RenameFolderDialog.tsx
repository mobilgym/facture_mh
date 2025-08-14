import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import type { Folder } from '@/types/file';

interface RenameFolderDialogProps {
  folder: Folder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RenameFolderDialog({ folder, isOpen, onClose, onSuccess }: RenameFolderDialogProps) {
  const [name, setName] = useState(folder.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: err } = await supabase
        .from('folders')
        .update({ name })
        .eq('id', folder.id);

      if (err) throw err;
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error renaming folder:', err);
      setError('Erreur lors du renommage du dossier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Renommer le dossier</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

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
              type="submit"
              disabled={loading}
            >
              {loading ? 'Renommage...' : 'Renommer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}