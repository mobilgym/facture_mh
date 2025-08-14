import React from 'react';
import { Folder as FolderIcon } from 'lucide-react';
import { useFolders } from '@/hooks/useFolders';
import FolderCard from './FolderCard';
import type { Folder } from '@/types/file';

export default function FolderList() {
  const { folders, loading, error } = useFolders();

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        {error}
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="text-center py-4">
        <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Aucun dossier</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {folders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} />
      ))}
    </div>
  );
}