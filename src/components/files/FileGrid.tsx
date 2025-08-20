import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/utils/date';
import { formatAmount } from '@/lib/utils/currency';
import { checkFileAvailability } from '@/lib/services/fileAvailabilityService';
import { FileText, Calendar, EuroIcon, Edit3, Save, X, Settings, Wallet } from 'lucide-react';
import FileActions from './FileActions';
import FileTotal from './FileTotal';
import { FileEditModal } from './FileEditModal';
import Button from '@/components/ui/Button';
import type { FileItem } from '@/types/file';

interface FileGridProps {
  files: FileItem[];
  onDelete?: (file: FileItem) => Promise<void>;
  onUpdate: () => void;
  onUpdateFile?: (fileId: string, updates: Partial<FileItem>) => Promise<void>;
  onBudgetExpenseUpdated?: () => void;
}

interface EditingState {
  fileId: string;
  field: 'amount' | 'date';
  value: string;
}

export default function FileGrid({ files = [], onDelete, onUpdate, onUpdateFile, onBudgetExpenseUpdated }: FileGridProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [availableFiles, setAvailableFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
    setEditingFile(file);
    setShowEditModal(true);
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
      >
        <AnimatePresence>
          {availableFiles.map((file) => (
            <motion.div
              key={file.id}
              variants={item}
              layoutId={file.id}
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 min-h-[180px] md:min-h-[200px] cursor-pointer"
              onClick={() => handleFileClick(file)}
            >
              <div className="flex flex-col h-full">
                {/* En-tête avec le nom de la facture */}
                <div className="p-3 md:p-4 border-b border-gray-100 bg-white">
                  {/* Titre avec icône */}
                  <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                      <div className="relative">
                        <div className="p-1.5 md:p-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg">
                          <FileText className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
                        </div>
                        {file.budget_id && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 shadow-sm">
                            <Wallet className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                    <h3 
                      className="font-medium text-gray-900 break-words leading-tight flex-1 cursor-pointer hover:text-cyan-600 transition-colors text-sm md:text-base line-clamp-2"
                      title={file.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.url, '_blank');
                      }}
                    >
                        {file.name}
                      </h3>
                    </div>
                  
                  {/* Boutons d'action séparés */}
                  <div className="flex justify-end items-center pt-2 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                    <FileActions
                      file={file}
                      onDelete={() => setSelectedFile(file)}
                    />
                  </div>
                </div>

                {/* Corps avec les métadonnées */}
                <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      {editing?.fileId === file.id && editing.field === 'date' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="text-xs md:text-sm border border-gray-300 rounded px-1 md:px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white w-20 md:w-auto"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white p-1"
                            title="Sauvegarder"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="hover:bg-red-50 hover:text-red-600 p-1"
                            title="Annuler"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 md:space-x-2 group">
                          <span className="text-xs md:text-sm text-gray-600">
                            {formatDate(file.document_date)}
                          </span>
                          {onUpdateFile && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // Convertir la date au format YYYY-MM-DD pour l'input date
                                const date = new Date(file.document_date);
                                const formattedDate = date.toISOString().split('T')[0];
                                handleEdit(file.id, 'date', formattedDate);
                              }}
                              className="opacity-60 group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 p-1"
                              title="Modifier la date"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <EuroIcon className="h-4 w-4" />
                      </div>
                      
                      {editing?.fileId === file.id && editing.field === 'amount' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="w-16 md:w-20 text-xs md:text-sm border border-cyan-300 rounded px-1 md:px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white p-1"
                            title="Sauvegarder"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="hover:bg-red-50 hover:text-red-600 p-1"
                            title="Annuler"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 md:space-x-2 group">
                      <span className="font-semibold text-xs md:text-sm">
                            {file.amount ? formatAmount(file.amount) : 'N/A'}
                      </span>
                          {onUpdateFile && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(file.id, 'amount', file.amount?.toString() || '0')}
                              className="opacity-60 group-hover:opacity-100 hover:bg-cyan-100 hover:text-cyan-700 transition-all duration-200 p-1"
                              title="Modifier le montant"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <FileTotal files={availableFiles} />

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
    </>
  );
}