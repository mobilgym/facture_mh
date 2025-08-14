import React, { useState } from 'react';
import { Eye, Download, Trash2, MoreVertical } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { FileItem } from '@/types/file';

interface DocumentActionsProps {
  file: FileItem;
}

export default function DocumentActions({ file }: DocumentActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePreview = () => {
    window.open(file.url, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-40">
            <div className="py-1">
              <button
                onClick={handlePreview}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualiser
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </button>
              <button
                onClick={() => {}}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}