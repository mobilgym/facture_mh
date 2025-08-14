import React from 'react';
import { FileText, Download, Eye, Receipt } from 'lucide-react';
import { useFiles } from '@/hooks/useFiles';
import { formatFileSize, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface FileListProps {
  folderId: string | null;
  filter: {
    search: string;
    date: Date | null;
    type: string | null;
  };
}

export default function FileList({ folderId, filter }: FileListProps) {
  const { files, loading, error, refetch } = useFiles(folderId);

  React.useEffect(() => {
    // Rafraîchir la liste toutes les 5 secondes
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-4 rounded-lg shadow">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Une erreur est survenue lors du chargement des factures
      </div>
    );
  }

  const filteredFiles = files.filter(file => {
    if (filter.search && !file.name.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    if (filter.date && file.createdAt) {
      const fileDate = new Date(file.createdAt);
      if (fileDate.toDateString() !== filter.date.toDateString()) {
        return false;
      }
    }
    if (filter.type && file.type !== filter.type) {
      return false;
    }
    return true;
  });

  if (filteredFiles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune facture trouvée
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredFiles.map((file) => (
        <div 
          key={file.id}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {file.type === 'application/pdf' ? (
                <FileText className="h-8 w-8 text-blue-500" />
              ) : (
                <Receipt className="h-8 w-8 text-green-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </h3>
                  <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{formatDate(new Date(file.createdAt))}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                    title="Visualiser"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.url;
                      link.download = file.name;
                      link.click();
                    }}
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}