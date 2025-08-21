import React, { useState, useMemo, useCallback } from 'react';
import FileGrid from './FileGrid';
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
}

export default function EnhancedFileGrid({
  files,
  onDelete,
  onUpdate,
  onUpdateFile,
  onBudgetExpenseUpdated
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

  // Filtrage des fichiers en fonction de la recherche
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // Filtre par nom de fichier
      if (searchFilters.search && !file.name.toLowerCase().includes(searchFilters.search.toLowerCase())) {
        return false;
      }

      // Filtres par date
      if (searchFilters.dateMode && searchFilters.dateFrom) {
        const fileDate = new Date(file.document_date);
        const filterDate = new Date(searchFilters.dateFrom);

        switch (searchFilters.dateMode) {
          case 'exact':
            if (fileDate.toDateString() !== filterDate.toDateString()) {
              return false;
            }
            break;
          case 'before':
            if (fileDate > filterDate) {
              return false;
            }
            break;
          case 'after':
            if (fileDate < filterDate) {
              return false;
            }
            break;
          case 'between':
            if (searchFilters.dateTo) {
              const toDate = new Date(searchFilters.dateTo);
              if (fileDate < filterDate || fileDate > toDate) {
                return false;
              }
            }
            break;
        }
      }

      // Filtres par montant
      if (searchFilters.amountMode && file.amount) {
        switch (searchFilters.amountMode) {
          case 'exact':
            if (searchFilters.amountExact && parseFloat(searchFilters.amountExact) !== file.amount) {
              return false;
            }
            break;
          case 'greater':
            if (searchFilters.amountMin && file.amount <= parseFloat(searchFilters.amountMin)) {
              return false;
            }
            break;
          case 'less':
            if (searchFilters.amountMin && file.amount >= parseFloat(searchFilters.amountMin)) {
              return false;
            }
            break;
          case 'between':
            if (searchFilters.amountMin && searchFilters.amountMax) {
              const min = parseFloat(searchFilters.amountMin);
              const max = parseFloat(searchFilters.amountMax);
              if (file.amount < min || file.amount > max) {
                return false;
              }
            }
            break;
        }
      }

      return true;
    });
  }, [files, searchFilters]);

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

  return (
    <div className="space-y-6">
      {/* Moteur de recherche avancée */}
      <AdvancedSearch
        onFiltersChange={setSearchFilters}
        onToggleSelection={handleToggleSelectionMode}
        selectionMode={selectionMode}
        selectedCount={selectedFiles.length}
      />

      {/* Grille de fichiers améliorée */}
      <FileGrid
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
