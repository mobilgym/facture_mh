import React, { useState } from 'react';
import { FolderTree } from 'lucide-react';
import { organizeAllFiles } from '@/lib/services/organization/batchOrganizer';
import Button from '@/components/ui/Button';

interface BatchOrganizerProps {
  onSuccess: () => void;
}

export default function BatchOrganizer({ onSuccess }: BatchOrganizerProps) {
  const [organizing, setOrganizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrganize = async () => {
    try {
      setOrganizing(true);
      setError(null);
      await organizeAllFiles();
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      console.error('Batch organization error:', err);
    } finally {
      setOrganizing(false);
    }
  };

  return (
    <div className="mb-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={handleOrganize}
        disabled={organizing}
        className="flex items-center"
      >
        <FolderTree className="h-4 w-4 mr-2" />
        {organizing ? 'Organisation en cours...' : 'Organiser tous les fichiers'}
      </Button>
    </div>
  );
}