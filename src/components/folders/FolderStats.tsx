import React from 'react';
import { BarChart3, FileText, HardDrive } from 'lucide-react';
import { useFolderStats } from '@/hooks/useFolderStats';
import { formatFileSize } from '@/lib/utils';

interface FolderStatsProps {
  folderId: string | null;
}

export default function FolderStats({ folderId }: FolderStatsProps) {
  const { stats, loading, error } = useFolderStats(folderId);

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg p-4 shadow">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
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
        <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
        Statistiques
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <FileText className="h-4 w-4 mr-2" />
            Fichiers
          </div>
          <span className="font-medium">{stats.totalFiles}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <HardDrive className="h-4 w-4 mr-2" />
            Taille totale
          </div>
          <span className="font-medium">{formatFileSize(stats.totalSize)}</span>
        </div>

        {Object.entries(stats.fileTypes).length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Types de fichiers
            </h4>
            <div className="space-y-2">
              {Object.entries(stats.fileTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{type}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}