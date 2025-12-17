import React, { useState, useEffect } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { checkFileAvailability } from '@/lib/services/fileAvailabilityService';
import type { FileItem } from '@/types/file';

interface FileActionsProps {
  file: FileItem;
  onDelete: () => void;
  skipAvailabilityCheck?: boolean;
}

export default function FileActions({ file, onDelete, skipAvailabilityCheck = false }: FileActionsProps) {
  const [isAvailable, setIsAvailable] = useState(true);
  const [checking, setChecking] = useState(!skipAvailabilityCheck);

  useEffect(() => {
    if (skipAvailabilityCheck) {
      setChecking(false);
      setIsAvailable(true);
      return;
    }

    let isActive = true;

    const checkAvailability = async () => {
      const available = await checkFileAvailability(file.path);
      if (!isActive) return;
      setIsAvailable(available);
      setChecking(false);
    };

    checkAvailability();
    return () => {
      isActive = false;
    };
  }, [file.path, skipAvailabilityCheck]);

  const actions = (
    <div className="flex items-center space-x-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.open(file.url, '_blank');
        }}
        className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:scale-105"
        title="Visualiser"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 transition-all duration-200 hover:scale-105"
        title="Supprimer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  if (skipAvailabilityCheck) {
    return actions;
  }

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

  return actions;
}
