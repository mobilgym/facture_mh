import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { checkFileAvailability } from '@/lib/services/fileAvailabilityService';
import type { FileItem } from '@/types/file';

interface FileTreeProps {
  files: FileItem[];
  selectedYear: string | null;
  selectedMonth: string | null;
  onSelectYear: (year: string) => void;
  onSelectMonth: (month: string) => void;
}

interface YearNode {
  year: string;
  months: {
    [key: string]: FileItem[];
  };
}

export default function FileTree({ 
  files, 
  selectedYear, 
  selectedMonth,
  onSelectYear,
  onSelectMonth 
}: FileTreeProps) {
  // Organiser les fichiers par année et mois
  const fileTree = useMemo(async () => {
    const tree: { [year: string]: YearNode } = {};
    
    // Vérifier la disponibilité de chaque fichier
    const availableFiles = await Promise.all(
      files.map(async (file) => {
        const isAvailable = await checkFileAvailability(file.path);
        return isAvailable ? file : null;
      })
    );

    // Ne garder que les fichiers disponibles
    const validFiles = availableFiles.filter((file): file is FileItem => file !== null);
    
    // Organiser les fichiers par année/mois
    validFiles.forEach(file => {
      const date = new Date(file.document_date || file.createdAt);
      const year = format(date, 'yyyy');
      const month = format(date, 'MM');
      
      if (!tree[year]) {
        tree[year] = { year, months: {} };
      }
      
      if (!tree[year].months[month]) {
        tree[year].months[month] = [];
      }
      
      tree[year].months[month].push(file);
    });
    
    // Filtrer les années vides
    const filteredTree = Object.entries(tree)
      .filter(([_, yearNode]) => Object.values(yearNode.months).some(files => files.length > 0))
      .reduce((acc, [year, yearNode]) => {
        // Filtrer les mois vides
        const nonEmptyMonths = Object.entries(yearNode.months)
          .filter(([_, files]) => files.length > 0)
          .reduce((monthAcc, [month, files]) => {
            monthAcc[month] = files;
            return monthAcc;
          }, {} as { [key: string]: FileItem[] });

        if (Object.keys(nonEmptyMonths).length > 0) {
          acc[year] = { ...yearNode, months: nonEmptyMonths };
        }
        return acc;
      }, {} as { [year: string]: YearNode });

    return Object.values(filteredTree).sort((a, b) => b.year.localeCompare(a.year));
  }, [files]);

  const [treeData, setTreeData] = React.useState<YearNode[]>([]);

  React.useEffect(() => {
    fileTree.then(setTreeData);
  }, [fileTree]);

  if (treeData.length === 0) {
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
        {treeData.map(yearNode => {
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
                    .map(([month, monthFiles]) => (
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
                          {monthFiles.length} facture{monthFiles.length > 1 ? 's' : ''}
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