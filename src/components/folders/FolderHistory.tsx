import React from 'react';
import { History, FileText, Share2, FolderInput, Trash2 } from 'lucide-react';
import { useFolderHistory } from '@/hooks/useFolderHistory';
import { formatDate } from '@/lib/utils';

interface FolderHistoryProps {
  folderId: string;
}

const actionIcons = {
  create: FileText,
  update: FileText,
  delete: Trash2,
  share: Share2,
  move: FolderInput
};

const actionLabels = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  share: 'Partage',
  move: 'Déplacement'
};

export default function FolderHistory({ folderId }: FolderHistoryProps) {
  const { history, loading, error } = useFolderHistory(folderId);

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg p-4 shadow">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
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
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <History className="h-5 w-5 mr-2 text-blue-500" />
        Historique
      </h3>

      <div className="space-y-4">
        {history.map(entry => {
          const Icon = actionIcons[entry.action];
          return (
            <div
              key={entry.id}
              className="flex items-start space-x-3 text-sm"
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {actionLabels[entry.action]}
                </p>
                <p className="text-gray-500">{entry.details}</p>
                <p className="text-xs text-gray-400">
                  {formatDate(new Date(entry.timestamp))}
                </p>
              </div>
            </div>
          );
        })}
        {history.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            Aucun historique
          </p>
        )}
      </div>
    </div>
  );
}