import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { EuroIcon, ShoppingCart, TrendingUp } from 'lucide-react';
import { formatAmount } from '@/lib/utils/currency';
import FileGrid from './FileGrid';
import type { FileItem } from '@/types/file';

interface FileTabsWithTotalsProps {
  files: FileItem[];
  onDelete?: (file: FileItem) => Promise<void>;
  onUpdate: () => void;
  onUpdateFile?: (fileId: string, updates: Partial<FileItem>) => Promise<void>;
  onBudgetExpenseUpdated?: () => void;
  // Props pour la sélection multiple
  selectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  selectedFiles?: string[];
  onSelectFile?: (fileId: string) => void;
  onBulkAction?: (action: string, fileIds: string[]) => void;
}

type TabType = 'achats' | 'ventes';

export default function FileTabsWithTotals({
  files,
  onDelete,
  onUpdate,
  onUpdateFile,
  onBudgetExpenseUpdated,
  selectionMode = false,
  onToggleSelectionMode,
  selectedFiles = [],
  onSelectFile,
  onBulkAction
}: FileTabsWithTotalsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('achats');

  // Filtrer les fichiers par type basé sur le préfixe du nom
  const { achatsFiles, ventesFiles, achatsTotal, ventesTotal } = useMemo(() => {
    const achats: FileItem[] = [];
    const ventes: FileItem[] = [];

    files.forEach(file => {
      // Vérifier le préfixe du nom de fichier
      if (file.name.toLowerCase().startsWith('ach_') || file.name.toLowerCase().startsWith('ach ')) {
        achats.push(file);
      } else if (file.name.toLowerCase().startsWith('vte_') || file.name.toLowerCase().startsWith('vte ')) {
        ventes.push(file);
      } else {
        // Par défaut, classer comme achat si pas de préfixe reconnu
        achats.push(file);
      }
    });

    // Calculer les totaux
    const achatsTotal = achats.reduce((sum, file) => {
      const amount = typeof file.amount === 'number' ? file.amount : 0;
      return sum + amount;
    }, 0);

    const ventesTotal = ventes.reduce((sum, file) => {
      const amount = typeof file.amount === 'number' ? file.amount : 0;
      return sum + amount;
    }, 0);

    return { achatsFiles: achats, ventesFiles: ventes, achatsTotal, ventesTotal };
  }, [files]);

  const currentFiles = activeTab === 'achats' ? achatsFiles : ventesFiles;
  const currentTotal = activeTab === 'achats' ? achatsTotal : ventesTotal;

  const TotalComponent = ({ total, type }: { total: number; type: TabType }) => {
    if (total === 0) return null;

    const isAchats = type === 'achats';
    const colorClasses = isAchats 
      ? 'from-red-50 to-orange-50 border-red-100 text-red-600 from-red-600 to-orange-600'
      : 'from-green-50 to-emerald-50 border-green-100 text-green-600 from-green-600 to-emerald-600';

    return (
      <div className={`p-4 bg-gradient-to-r ${isAchats ? 'from-red-50 to-orange-50 border-red-100' : 'from-green-50 to-emerald-50 border-green-100'} rounded-lg border shadow-sm mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <EuroIcon className={`h-5 w-5 ${isAchats ? 'text-red-600' : 'text-green-600'}`} />
            <span className={`font-medium ${isAchats ? 'text-red-900' : 'text-green-900'}`}>
              Total des {type}
            </span>
          </div>
          <span className={`text-lg font-semibold bg-gradient-to-r ${isAchats ? 'from-red-600 to-orange-600' : 'from-green-600 to-emerald-600'} bg-clip-text text-transparent`}>
            {formatAmount(total)}
          </span>
        </div>
      </div>
    );
  };

  const tabs = [
    {
      id: 'achats' as TabType,
      name: 'Achats',
      icon: ShoppingCart,
      count: achatsFiles.length,
      total: achatsTotal,
      color: 'red'
    },
    {
      id: 'ventes' as TabType,
      name: 'Ventes', 
      icon: TrendingUp,
      count: ventesFiles.length,
      total: ventesTotal,
      color: 'green'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  isActive
                    ? tab.color === 'red' 
                      ? 'border-red-500 text-red-600' 
                      : 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`mr-2 h-4 w-4 transition-colors duration-200 ${
                    isActive
                      ? tab.color === 'red' 
                        ? 'text-red-500' 
                        : 'text-green-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.name}
                <span
                  className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                    isActive
                      ? tab.color === 'red' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
                {tab.total > 0 && (
                  <span
                    className={`ml-2 text-xs font-semibold transition-colors duration-200 ${
                      isActive
                        ? tab.color === 'red' 
                          ? 'text-red-700' 
                          : 'text-green-700'
                        : 'text-gray-500'
                    }`}
                  >
                    ({formatAmount(tab.total)})
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Total pour l'onglet actif */}
      <TotalComponent total={currentTotal} type={activeTab} />

      {/* Contenu de l'onglet */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <FileGrid
          files={currentFiles}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onUpdateFile={onUpdateFile}
          onBudgetExpenseUpdated={onBudgetExpenseUpdated}
          selectionMode={selectionMode}
          onToggleSelectionMode={onToggleSelectionMode}
          selectedFiles={selectedFiles}
          onSelectFile={onSelectFile}
          onBulkAction={onBulkAction}
        />
      </motion.div>

      {/* Résumé financier */}
      {(achatsTotal > 0 || ventesTotal > 0) && (
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé financier</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-red-100">
              <div className="text-sm text-red-600 font-medium">Total Achats</div>
              <div className="text-xl font-bold text-red-700">{formatAmount(achatsTotal)}</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-green-100">
              <div className="text-sm text-green-600 font-medium">Total Ventes</div>
              <div className="text-xl font-bold text-green-700">{formatAmount(ventesTotal)}</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
              <div className="text-sm text-blue-600 font-medium">Solde</div>
              <div className={`text-xl font-bold ${ventesTotal - achatsTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatAmount(ventesTotal - achatsTotal)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}