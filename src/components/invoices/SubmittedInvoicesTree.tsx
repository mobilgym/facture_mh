import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SubmittedInvoice } from '@/types/invoice';

interface SubmittedInvoicesTreeProps {
  invoices: SubmittedInvoice[];
  selectedYear: string | null;
  selectedMonth: string | null;
  onSelectYear: (year: string) => void;
  onSelectMonth: (month: string) => void;
}

interface YearNode {
  year: string;
  months: {
    [key: string]: SubmittedInvoice[];
  };
}

export default function SubmittedInvoicesTree({
  invoices,
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth
}: SubmittedInvoicesTreeProps) {
  const fileTree = useMemo(() => {
    const tree: { [year: string]: YearNode } = {};
    
    invoices.forEach(invoice => {
      const year = invoice.year;
      const month = invoice.month;
      
      if (!tree[year]) {
        tree[year] = { year, months: {} };
      }
      
      if (!tree[year].months[month]) {
        tree[year].months[month] = [];
      }
      
      tree[year].months[month].push(invoice);
    });
    
    return Object.values(tree).sort((a, b) => b.year.localeCompare(a.year));
  }, [invoices]);

  if (fileTree.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Folder className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>Aucune facture disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium text-gray-900">Structure des factures</h2>
      </div>
      
      <div className="p-2">
        {fileTree.map(yearNode => {
          const totalFiles = Object.values(yearNode.months).flat().length;
          
          return (
            <div key={yearNode.year} className="space-y-1">
              <button
                onClick={() => onSelectYear(yearNode.year)}
                className={`w-full flex items-center p-2 rounded-md hover:bg-gray-100 ${
                  selectedYear === yearNode.year ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                {selectedYear === yearNode.year ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                <span className="font-medium">{yearNode.year}</span>
                <span className="ml-auto text-sm text-gray-500">
                  {totalFiles} facture{totalFiles > 1 ? 's' : ''}
                </span>
              </button>

              {selectedYear === yearNode.year && (
                <div className="ml-6 space-y-1">
                  {Object.entries(yearNode.months)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([month, monthInvoices]) => (
                      <button
                        key={month}
                        onClick={() => onSelectMonth(month)}
                        className={`w-full flex items-center p-2 rounded-md hover:bg-gray-100 ${
                          selectedMonth === month ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        <span>
                          {format(new Date(parseInt(yearNode.year), parseInt(month) - 1), 'MMMM', { locale: fr })}
                        </span>
                        <span className="ml-auto text-sm text-gray-500">
                          {monthInvoices.length} facture{monthInvoices.length > 1 ? 's' : ''}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}