import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useFileOrganizer } from '@/hooks/useFileOrganizer';
import Button from '@/components/ui/Button';
import type { FileItem } from '@/types/file';

interface FileOrganizerProps {
  file: FileItem;
  onSuccess: () => void;
}

export default function FileOrganizer({ file, onSuccess }: FileOrganizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { organizing, error, organizeOne } = useFileOrganizer();
  const [selectedDate, setSelectedDate] = useState<Date>(
    file.document_date ? new Date(file.document_date) : new Date()
  );

  const handleOrganize = async () => {
    try {
      await organizeOne(file.id, selectedDate);
      onSuccess();
      setIsOpen(false);
    } catch (err) {
      console.error('Organization error:', err);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
        title="Organiser"
      >
        <Calendar className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Organiser le fichier</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date du document
            </label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={organizing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleOrganize}
              disabled={organizing}
            >
              {organizing ? 'Organisation...' : 'Organiser'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}