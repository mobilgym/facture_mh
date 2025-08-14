import React, { useState } from 'react';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useFolders } from '@/hooks/useFolders';
import Button from '@/components/ui/Button';
import type { Folder } from '@/types/file';

interface MoveFilesDialogProps {
  sourceFolder: Folder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MoveFilesDialog({ sourceFolder, isOpen, onClose, onSuccess }: MoveFilesDialogProps) {
  const { folders } = useFolders();
  const [targetFolderId, setTargetFolderId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleMove = async () => {
    if (!targetFolderId) return;
    
    setLoading(true);
    setError('');

    try {
      const batch = writeBatch(db);
      
      // Get all files from source folder
      const filesQuery = query(
        collection(db, 'files'),
        where('folderId', '==', sourceFolder.id)
      );
      const filesSnapshot = await getDocs(filesQuery);
      
      // Update each file's folderId
      filesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { folderId: targetFolderId });
      });
      
      await batch.commit();
      onSuccess();
      onClose();
    } catch (err) {
      setError('Erreur lors du déplacement des fichiers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const availableFolders = folders.filter(folder => folder.id !== sourceFolder.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Déplacer les fichiers</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dossier de destination
          </label>
          <select
            value={targetFolderId}
            onChange={(e) => setTargetFolderId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Sélectionner un dossier</option>
            {availableFolders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
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
            type="button"
            onClick={handleMove}
            disabled={loading || !targetFolderId}
          >
            {loading ? 'Déplacement...' : 'Déplacer'}
          </Button>
        </div>
      </div>
    </div>
  );
}