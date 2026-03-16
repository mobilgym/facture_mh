import React from 'react';
import { ChevronRight, Home, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';

interface FileBreadcrumbProps {
  year: string | null;
  month: string | null;
  onNavigate: (year: string | null, month: string | null) => void;
  onPrint?: () => void;
  printDisabled?: boolean;
}

export default function FileBreadcrumb({ year, month, onNavigate, onPrint, printDisabled = false }: FileBreadcrumbProps) {
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

      <div className="ml-4 flex items-center gap-2">
        {year && onPrint && (
          <Button variant="outline" size="sm" onClick={onPrint} disabled={printDisabled}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        )}

        {(year || month) && (
          <BackButton
            onClick={() => onNavigate(month ? year : null, null)}
          />
        )}
      </div>
    </div>
  );
}
