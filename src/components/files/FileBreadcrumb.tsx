import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BackButton from '@/components/ui/BackButton';

interface FileBreadcrumbProps {
  year: string | null;
  month: string | null;
  onNavigate: (year: string | null, month: string | null) => void;
}

export default function FileBreadcrumb({ year, month, onNavigate }: FileBreadcrumbProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <button
          onClick={() => onNavigate(null, null)}
          className="flex items-center hover:text-gray-900"
        >
          <Home className="h-4 w-4" />
        </button>

        {year && (
          <>
            <ChevronRight className="h-4 w-4" />
            <button
              onClick={() => onNavigate(year, null)}
              className="hover:text-gray-900"
            >
              {year}
            </button>
          </>
        )}

        {month && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">
              {format(new Date(parseInt(year!), parseInt(month) - 1), 'MMMM', { locale: fr })}
            </span>
          </>
        )}
      </nav>

      {(year || month) && (
        <BackButton
          onClick={() => onNavigate(month ? year : null, null)}
          className="ml-4"
        />
      )}
    </div>
  );
}