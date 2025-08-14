import React, { useState } from 'react';
import { Share2, UserPlus, X } from 'lucide-react';
import { useFolderSharing } from '@/hooks/useFolderSharing';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface FolderSharingProps {
  folderId: string;
}

export default function FolderSharing({ folderId }: FolderSharingProps) {
  const { shares, loading, error, addShare, removeShare, updateShareRole } = useFolderSharing(folderId);
  const [isAdding, setIsAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await addShare(email, role);
      setEmail('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg p-4 shadow">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Share2 className="h-5 w-5 mr-2 text-blue-500" />
          Partages
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="text-blue-600"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleShare} className="mb-4 space-y-3">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="viewer">Lecteur</option>
              <option value="editor">Éditeur</option>
            </select>
            <Button type="submit" size="sm">
              Partager
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {shares.map(share => (
          <div
            key={share.email}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
          >
            <div>
              <p className="font-medium text-sm">{share.email}</p>
              <p className="text-xs text-gray-500">
                Partagé le {formatDate(new Date(share.sharedAt))}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={share.role}
                onChange={(e) => updateShareRole(share.email, e.target.value as 'viewer' | 'editor')}
                className="text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="viewer">Lecteur</option>
                <option value="editor">Éditeur</option>
              </select>
              <button
                onClick={() => removeShare(share.email)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {shares.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            Aucun partage
          </p>
        )}
      </div>
    </div>
  );
}