import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkFileAvailability } from '@/lib/services/fileAvailabilityService';
import FileGridItem from './FileGridItem';
import FileTotal from './FileTotal';
import { FileEditModal } from './FileEditModal';
import FloatingActionBar from './FloatingActionBar';
import DeleteFileDialog from './DeleteFileDialog';
import QuickAssignmentPopup from './QuickAssignmentPopup';
import Button from '@/components/ui/Button';
import type { FileItem } from '@/types/file';
import { useBudgets } from '@/hooks/useBudgets';
import { useBadges } from '@/hooks/useBadges';

interface FileGridProps {
  files: FileItem[];
  onDelete?: (file: FileItem) => Promise<void>;
  onUpdate: () => void;
  onUpdateFile?: (fileId: string, updates: Partial<FileItem>) => Promise<void>;
  onBudgetExpenseUpdated?: () => void;
  // Nouvelles props pour la sélection multiple
  selectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  selectedFiles?: string[];
  onSelectFile?: (fileId: string) => void;
  onBulkAction?: (action: string, fileIds: string[]) => void;
}

interface EditingState {
  fileId: string;
  field: 'amount' | 'date';
  value: string;
}

export default function FileGrid({ 
  files = [], 
  onDelete, 
  onUpdate, 
  onUpdateFile, 
  onBudgetExpenseUpdated,
  selectionMode = false,
  onToggleSelectionMode,
  selectedFiles = [],
  onSelectFile,
  onBulkAction
}: FileGridProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [availableFiles, setAvailableFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // États pour le popup de raccourci
  const [quickAssignmentFile, setQuickAssignmentFile] = useState<FileItem | null>(null);
  const [showQuickAssignment, setShowQuickAssignment] = useState(false);
  const [quickAssignmentPosition, setQuickAssignmentPosition] = useState({ x: 0, y: 0 });
  
  // Hooks pour récupérer les données des budgets et badges
  const { budgets } = useBudgets();
  const { badges } = useBadges();

  useEffect(() => {
    const checkFiles = async () => {
      setLoading(true);
      const checkedFiles = await Promise.all(
        files.map(async (file) => {
          const isAvailable = await checkFileAvailability(file.path);
          return isAvailable ? file : null;
        })
      );
      setAvailableFiles(checkedFiles.filter((file): file is FileItem => file !== null));
      setLoading(false);
    };

    checkFiles();
  }, [files]);

  const handleEdit = (fileId: string, field: 'amount' | 'date', currentValue: string) => {
    setEditing({ fileId, field, value: currentValue });
  };

  const handleEditingChange = (value: string) => {
    if (editing) {
      setEditing({ ...editing, value });
    }
  };

  const handleSave = async () => {
    if (!editing || !onUpdateFile) return;

    try {
      const updates: Partial<FileItem> = {};
      
      if (editing.field === 'amount') {
        const numericValue = parseFloat(editing.value);
        if (!isNaN(numericValue)) {
          updates.amount = numericValue;
        }
      } else if (editing.field === 'date') {
        // Validation de la date
        const dateValue = new Date(editing.value);
        if (!isNaN(dateValue.getTime())) {
          updates.document_date = dateValue.toISOString();
          // Mettre à jour aussi year et month
          updates.year = dateValue.getFullYear().toString();
          updates.month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
        }
      }

      await onUpdateFile(editing.fileId, updates);
      setEditing(null);
      onUpdate(); // Refresh the list
    } catch (error) {
      console.error('Error updating file:', error);
    }
  };

  const handleCancel = () => {
    setEditing(null);
  };

  const handleFileClick = (file: FileItem) => {
    if (selectionMode) {
      // En mode sélection, toggle la sélection au lieu d'ouvrir le modal
      onSelectFile?.(file.id);
    } else {
      setEditingFile(file);
      setShowEditModal(true);
    }
  };

  const handleSelectFile = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onSelectFile?.(fileId);
  };

  // Gestionnaires pour le popup de raccourci
  const handleLongPress = (file: FileItem, event: TouchEvent | MouseEvent) => {
    // Calculer la position du popup
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    setQuickAssignmentPosition({ x: clientX, y: clientY });
    setQuickAssignmentFile(file);
    setShowQuickAssignment(true);
    
    // Feedback haptique sur mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleQuickAssignmentClose = () => {
    setShowQuickAssignment(false);
    setQuickAssignmentFile(null);
  };

  const handleQuickAssignmentComplete = () => {
    onUpdate(); // Refresh pour voir les changements
  };

  // Fonction pour obtenir les informations du budget
  const getBudgetInfo = (budgetId: string) => {
    return budgets.find(b => b.id === budgetId);
  };

  // Fonction pour obtenir les informations des badges
  const getBadgeInfo = (badgeIds: string[]) => {
    return badges.filter(b => badgeIds.includes(b.id));
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingFile(null);
  };

  const handleFileUpdated = () => {
    onUpdate();
  };

  const handleFileDeleted = () => {
    onUpdate();
  };

  const handleDeleteClick = (file: FileItem) => {
    setSelectedFile(file);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFile || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(selectedFile);
      setShowDeleteModal(false);
      setSelectedFile(null);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedFile(null);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-3"
      >
        <AnimatePresence>
          {availableFiles.map((file) => {
            const isSelected = selectedFiles.includes(file.id);
            
            return (
              <FileGridItem
                key={file.id}
                file={file}
                isSelected={isSelected}
                selectionMode={selectionMode}
                editing={editing}
                onLongPress={handleLongPress}
                onFileClick={handleFileClick}
                onSelectFile={handleSelectFile}
                onEdit={handleEdit}
                onEditingChange={handleEditingChange}
                onSave={handleSave}
                onCancel={handleCancel}
                onDeleteClick={handleDeleteClick}
                onUpdateFile={onUpdateFile}
                onUpdate={onUpdate}
                getBudgetInfo={getBudgetInfo}
                getBadgeInfo={getBadgeInfo}
                item={item}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>

      <FileTotal files={availableFiles} />

      {/* Barre d'action flottante pour la sélection multiple */}
      {selectionMode && selectedFiles.length > 0 && (
        <FloatingActionBar
          selectedCount={selectedFiles.length}
          onClose={() => onToggleSelectionMode?.()}
          onBulkAction={(action) => onBulkAction?.(action, selectedFiles)}
        />
      )}

      {/* Modal d'édition */}
      {showEditModal && editingFile && (
        <FileEditModal
          file={editingFile}
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onFileUpdated={handleFileUpdated}
          onFileDeleted={handleFileDeleted}
          onBudgetExpenseUpdated={onBudgetExpenseUpdated}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <DeleteFileDialog
        file={selectedFile}
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Popup de raccourci pour assignation rapide */}
      {quickAssignmentFile && (
        <QuickAssignmentPopup
          file={quickAssignmentFile}
          isOpen={showQuickAssignment}
          onClose={handleQuickAssignmentClose}
          onAssignmentComplete={handleQuickAssignmentComplete}
          position={quickAssignmentPosition}
        />
      )}
    </>
  );
}