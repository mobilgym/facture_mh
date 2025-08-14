import React from 'react';
import { formatAmount } from '@/lib/utils/currency';
import { EuroIcon } from 'lucide-react';
import type { FileItem } from '@/types/file';

interface FileTotalProps {
  files: FileItem[];
}

export default function FileTotal({ files }: FileTotalProps) {
  const total = React.useMemo(() => {
    return files.reduce((sum, file) => {
      // Convertit la chaîne en nombre et ajoute au total seulement si c'est un nombre valide
      const amount = typeof file.amount === 'number' ? file.amount : 0;
      return sum + amount;
    }, 0);
  }, [files]);

  if (total === 0) return null;

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <EuroIcon className="h-5 w-5 text-cyan-600" />
          <span className="font-medium text-cyan-900">Total des montants</span>
        </div>
        <span className="text-lg font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          {formatAmount(total)}
        </span>
      </div>
    </div>
  );
}