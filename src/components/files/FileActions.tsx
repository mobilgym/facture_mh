import React, { useState, useEffect } from 'react';
import { Eye, Download, Trash2 } from 'lucide-react';
import { checkFileAvailability } from '@/lib/services/fileAvailabilityService';
import type { FileItem } from '@/types/file';

interface FileActionsProps {
  file: FileItem;
  onDelete: () => void;
}

export default function FileActions({ file, onDelete }: FileActionsProps) {
  const [isAvailable, setIsAvailable] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      const available = await checkFileAvailability(file.path);
      setIsAvailable(available);
      setChecking(false);
    };

    checkAvailability();
  }, [file.path]);

  if (checking) {
    return (
      <div className="flex items-center space-x-2 opacity-50">
        <div className="animate-pulse h-8 w-24 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="px-3 py-1 text-sm text-red-600 bg-red-50 rounded-md">
        Facture non disponible
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.open(file.url, '_blank');
        }}
        className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:scale-105"
        title="Visualiser"
      >
        <Eye className="h-4 w-4" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 transition-all duration-200 hover:scale-105"
        title="Supprimer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}