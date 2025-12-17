import React, { useState, useMemo, useCallback } from 'react';
import FileTabsWithTotals from './FileTabsWithTotals';
import AdvancedSearch, { SearchFilters } from './AdvancedSearch';
import BulkActionModal from './BulkActionModal';
import type { FileItem } from '@/types/file';
import { FileService } from '@/lib/services/fileService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedFileGridProps {
  files: FileItem[];
  onDelete?: (file: FileItem) => Promise<void>;
  onUpdate: () => void;
  onUpdateFile?: (fileId: string, updates: Partial<FileItem>) => Promise<void>;
  onBudgetExpenseUpdated?: () => void;
  selectedPeriod?: { year: string | null; month: string | null };
}

export default function EnhancedFileGrid({
  files,
  onDelete,
  onUpdate,
  onUpdateFile,
  onBudgetExpenseUpdated,
  selectedPeriod
}: EnhancedFileGridProps) {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    amountExact: '',
    dateMode: '',
    amountMode: ''
  });
  
  // Gestion de la sélection multiple
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Modal d'action en lot
  const [bulkActionModal, setBulkActionModal] = useState<{
    isOpen: boolean;
    action: string;
  }>({
    isOpen: false,
    action: ''
  });

  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();

  // Fonction pour normaliser un montant saisi par l'utilisateur
  const normalizeAmount = (amountStr: string): number | null => {
    if (!amountStr) return null;

    // Nettoyer la chaîne : retirer les espaces
    let cleaned = amountStr.trim().replace(/\s/g, '');

    // Détecter le format : si plusieurs virgules ou points, c'est un séparateur de milliers
    const commaCount = (cleaned.match(/,/g) || []).length;
    const dotCount = (cleaned.match(/\./g) || []).length;

    // Format français : 1.234,56 ou 1234,56
    // Format anglais : 1,234.56 ou 1234.56

    if (commaCount > 1) {
      // Format anglais avec virgules comme séparateur de milliers : 1,234,567.89
      cleaned = cleaned.replace(/,/g, '');
    } else if (dotCount > 1) {
      // Format avec points comme séparateur de milliers : 1.234.567,89
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (commaCount === 1 && dotCount === 1) {
      // Ambiguïté : déterminer lequel est le séparateur décimal
      const commaPos = cleaned.indexOf(',');
      const dotPos = cleaned.indexOf('.');

      if (dotPos < commaPos) {
        // Format : 1.234,56 (français)
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // Format : 1,234.56 (anglais)
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (commaCount === 1) {
      // Une seule virgule : c'est le séparateur décimal français
      cleaned = cleaned.replace(',', '.');
    }
    // Si un seul point, on le garde (format anglais standard)

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  // Filtrage des fichiers en fonction de la recherche
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // FILTRAGE PAR PÉRIODE DE NAVIGATION (en premier)
      // Si une période est sélectionnée via la navigation, l'appliquer comme filtre de base
      if (selectedPeriod?.year) {
        // Filtrer par année
        if (file.year !== selectedPeriod.year) return false;

        // Si un mois est spécifié, filtrer aussi par mois
        if (selectedPeriod.month && file.month !== selectedPeriod.month) return false;
      }

      // Recherche textuelle étendue (nom, montant, date)
      if (searchFilters.search) {
        const searchTerm = searchFilters.search.toLowerCase();
        const fileName = file.name.toLowerCase();
        const fileAmount = file.amount ? file.amount.toString() : '';
        const fileDate = file.document_date ? new Date(file.document_date).toLocaleDateString('fr-FR') : '';

        // Essayer aussi de détecter si la recherche est un montant
        const searchAsAmount = normalizeAmount(searchFilters.search);
        const matchesAmount = searchAsAmount !== null && file.amount && Math.abs(file.amount - searchAsAmount) < 0.01;

        const matchesSearch = fileName.includes(searchTerm) ||
                             fileAmount.includes(searchTerm) ||
                             fileDate.includes(searchTerm) ||
                             matchesAmount;

        if (!matchesSearch) {
          return false;
        }
      }

      // Filtres par date
      if (searchFilters.dateMode) {
        const fileDate = new Date(file.document_date);
        
        switch (searchFilters.dateMode) {
          case 'exact':
            if (searchFilters.dateFrom) {
              const filterDate = new Date(searchFilters.dateFrom);
              if (fileDate.toDateString() !== filterDate.toDateString()) {
                return false;
              }
            }
            break;
          case 'before':
            if (searchFilters.dateFrom) {
              const filterDate = new Date(searchFilters.dateFrom);
              if (fileDate > filterDate) {
                return false;
              }
            }
            break;
          case 'after':
            if (searchFilters.dateFrom) {
              const filterDate = new Date(searchFilters.dateFrom);
              if (fileDate < filterDate) {
                return false;
              }
            }
            break;
          case 'between':
            if (searchFilters.dateFrom && searchFilters.dateTo) {
              const fromDate = new Date(searchFilters.dateFrom);
              const toDate = new Date(searchFilters.dateTo);
              if (fileDate < fromDate || fileDate > toDate) {
                return false;
              }
            }
            break;
          case 'year':
            if (searchFilters.year) {
              const fileYear = fileDate.getFullYear();
              if (fileYear !== parseInt(searchFilters.year)) {
                return false;
              }
            }
            break;
          case 'month':
            if (searchFilters.year && searchFilters.month) {
              const fileYear = fileDate.getFullYear();
              const fileMonth = fileDate.getMonth() + 1; // getMonth() returns 0-11
              if (fileYear !== parseInt(searchFilters.year) || 
                  fileMonth !== parseInt(searchFilters.month)) {
                return false;
              }
            }
            break;
          case 'quarter':
            if (searchFilters.year && searchFilters.quarter) {
              const fileYear = fileDate.getFullYear();
              const fileMonth = fileDate.getMonth() + 1;
              const fileQuarter = Math.ceil(fileMonth / 3);
              const selectedQuarter = parseInt(searchFilters.quarter.substring(1)); // "Q1" -> 1
              
              if (fileYear !== parseInt(searchFilters.year) || 
                  fileQuarter !== selectedQuarter) {
                return false;
              }
            }
            break;
        }
      }

      // Filtres par montant avec normalisation intelligente
      if (searchFilters.amountMode && file.amount) {
        switch (searchFilters.amountMode) {
          case 'exact':
            if (searchFilters.amountExact) {
              const exactAmount = normalizeAmount(searchFilters.amountExact);
              if (exactAmount === null || Math.abs(file.amount - exactAmount) >= 0.01) {
                return false;
              }
            }
            break;
          case 'greater':
            if (searchFilters.amountMin) {
              const minAmount = normalizeAmount(searchFilters.amountMin);
              if (minAmount === null || file.amount <= minAmount) {
                return false;
              }
            }
            break;
          case 'less':
            if (searchFilters.amountMin) {
              const maxAmount = normalizeAmount(searchFilters.amountMin);
              if (maxAmount === null || file.amount >= maxAmount) {
                return false;
              }
            }
            break;
          case 'between':
            if (searchFilters.amountMin && searchFilters.amountMax) {
              const min = normalizeAmount(searchFilters.amountMin);
              const max = normalizeAmount(searchFilters.amountMax);
              if (min === null || max === null || file.amount < min || file.amount > max) {
                return false;
              }
            }
            break;
        }
      }

      return true;
    });
  }, [files, searchFilters, selectedPeriod]);

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedFiles([]);
    }
  }, [selectionMode]);

  const handleSelectFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  const handleBulkAction = useCallback((action: string, fileIds: string[]) => {
    setBulkActionModal({
      isOpen: true,
      action
    });
  }, []);

  const handleBulkActionConfirm = async (data: any) => {
    if (!user) {
      showError('Utilisateur non connecté');
      return;
    }

    try {
      const promises = selectedFiles.map(async (fileId) => {
        const updates: Partial<FileItem> = {};

        switch (bulkActionModal.action) {
          case 'assign-budget':
            updates.budget_id = data.budgetId;
            break;
          case 'assign-badges':
            if (data.budgetId) {
              updates.budget_id = data.budgetId;
            }
            updates.badge_ids = data.badgeIds;
            break;
          case 'remove-assignments':
            updates.budget_id = null;
            updates.badge_ids = null;
            break;
          case 'delete':
            const file = files.find(f => f.id === fileId);
            if (file && onDelete) {
              await onDelete(file);
            }
            return;
          case 'download':
            const downloadFile = files.find(f => f.id === fileId);
            if (downloadFile) {
              window.open(downloadFile.url, '_blank');
            }
            return;
        }

        if (onUpdateFile && Object.keys(updates).length > 0) {
          await onUpdateFile(fileId, updates);
        }
      });

      await Promise.all(promises);
      
      showSuccess(`Action appliquée à ${selectedFiles.length} facture(s)`);
      setSelectedFiles([]);
      setSelectionMode(false);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'action en lot:', error);
      showError('Erreur lors de l\'application de l\'action');
    } finally {
      setBulkActionModal({ isOpen: false, action: '' });
    }
  };

  const handleCloseBulkModal = () => {
    setBulkActionModal({ isOpen: false, action: '' });
  };

  // Vérifier si des filtres sont actifs (recherche ou navigation)
  const hasActiveFilters = searchFilters.search ||
                           searchFilters.dateMode ||
                           searchFilters.amountMode;

  const hasNavigationFilter = selectedPeriod?.year;

  return (
    <div className="space-y-6">
      {/* Moteur de recherche avancée */}
      <AdvancedSearch
        onFiltersChange={setSearchFilters}
        onToggleSelection={handleToggleSelectionMode}
        selectionMode={selectionMode}
        selectedCount={selectedFiles.length}
      />

      {/* Affichage de la période sélectionnée via navigation */}
      {hasNavigationFilter && !hasActiveFilters && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-cyan-500 rounded-full"></div>
              <p className="text-sm font-medium text-cyan-900">
                {selectedPeriod.month
                  ? `Période sélectionnée : ${new Date(parseInt(selectedPeriod.year), parseInt(selectedPeriod.month) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                  : `Période sélectionnée : Année ${selectedPeriod.year}`
                }
              </p>
            </div>
            <p className="text-xs text-cyan-700">
              {filteredFiles.length} facture{filteredFiles.length > 1 ? 's' : ''}
              {filteredFiles.length > 0 && ` • ${new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(filteredFiles.reduce((sum, f) => sum + (f.amount || 0), 0))}`}
            </p>
          </div>
          <p className="text-xs text-cyan-600 mt-2">
            💡 Utilisez les filtres ci-dessus pour rechercher dans toutes les périodes
          </p>
        </div>
      )}

      {/* Affichage du nombre de résultats si des filtres de recherche sont actifs */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium text-blue-900">
                {filteredFiles.length === 0 ? (
                  "Aucun résultat trouvé"
                ) : filteredFiles.length === 1 ? (
                  "1 facture trouvée"
                ) : (
                  `${filteredFiles.length} factures trouvées`
                )}
              </p>
            </div>
            {filteredFiles.length > 0 && (
              <p className="text-xs text-blue-700">
                Montant total : {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(filteredFiles.reduce((sum, f) => sum + (f.amount || 0), 0))}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Grille de fichiers avec onglets par type */}
      <FileTabsWithTotals
        files={filteredFiles}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onUpdateFile={onUpdateFile}
        onBudgetExpenseUpdated={onBudgetExpenseUpdated}
        selectionMode={selectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        selectedFiles={selectedFiles}
        onSelectFile={handleSelectFile}
        onBulkAction={handleBulkAction}
      />

      {/* Modal d'action en lot */}
      <BulkActionModal
        isOpen={bulkActionModal.isOpen}
        onClose={handleCloseBulkModal}
        selectedFileIds={selectedFiles}
        action={bulkActionModal.action as any}
        onConfirm={handleBulkActionConfirm}
      />
    </div>
  );
}
