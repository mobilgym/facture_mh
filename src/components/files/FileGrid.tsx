import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/utils/date';
import { formatAmount } from '@/lib/utils/currency';
import { checkFileAvailability } from '@/lib/services/fileAvailabilityService';
import { FileText, Calendar, EuroIcon, Edit3, Save, X, Settings, Wallet, Tag, Check } from 'lucide-react';
import FileActions from './FileActions';
import FileTotal from './FileTotal';
import { FileEditModal } from './FileEditModal';
import FloatingActionBar from './FloatingActionBar';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
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
              <motion.div
                key={file.id}
                variants={item}
                layoutId={file.id}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border ${
                  isSelected 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                } cursor-pointer group backdrop-blur-sm ${
                  selectionMode ? 'cursor-pointer' : ''
                }`}
                onClick={() => handleFileClick(file)}
              >
                {/* Overlay de sélection */}
                {selectionMode && (
                  <div 
                    className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}
                    onClick={(e) => handleSelectFile(file.id, e)}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                )}

                {/* Indicateurs de budget et badges avec tooltips */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  {file.budget_id && (
                    <Tooltip
                      content={
                        <div className="text-center">
                          <div className="font-medium">Budget assigné</div>
                          <div className="text-xs mt-1">
                            {getBudgetInfo(file.budget_id)?.name || 'Budget inconnu'}
                          </div>
                        </div>
                      }
                      position="bottom"
                    >
                      <div className="bg-green-500/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
                        <Wallet className="h-3 w-3 text-white" />
                      </div>
                    </Tooltip>
                  )}
                  {file.badge_ids && file.badge_ids.length > 0 && (
                    <div className="flex space-x-0.5">
                      {getBadgeInfo(file.badge_ids).slice(0, 3).map((badge, index) => (
                        <Tooltip
                          key={badge.id}
                          content={
                            <div className="text-center">
                              <div className="font-medium">{badge.name}</div>
                              {file.badge_ids && file.badge_ids.length > 1 && (
                                <div className="text-xs mt-1">
                                  {index + 1} sur {file.badge_ids.length} badge{file.badge_ids.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          }
                          position="bottom"
                        >
                          <div 
                            className="backdrop-blur-sm rounded-full p-1 shadow-sm ring-1 ring-white/20"
                            style={{ backgroundColor: `${badge.color}90` }} // 90 pour la transparence
                          >
                            <Tag className="h-2.5 w-2.5 text-white" />
                          </div>
                        </Tooltip>
                      ))}
                      {file.badge_ids.length > 3 && (
                        <Tooltip
                          content={
                            <div className="text-center">
                              <div className="font-medium">
                                +{file.badge_ids.length - 3} badge{file.badge_ids.length - 3 > 1 ? 's' : ''} supplémentaire{file.badge_ids.length - 3 > 1 ? 's' : ''}
                              </div>
                              <div className="text-xs mt-1 space-y-1">
                                {getBadgeInfo(file.badge_ids).slice(3).map(badge => (
                                  <div key={badge.id} className="flex items-center space-x-1">
                                    <div 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: badge.color }}
                                    ></div>
                                    <span>{badge.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          }
                          position="bottom"
                        >
                          <div className="bg-gray-600/90 backdrop-blur-sm rounded-full p-1 shadow-sm ring-1 ring-white/20">
                            <span className="text-white text-[10px] font-bold leading-none">
                              +{file.badge_ids.length - 3}
                            </span>
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3">
                  {/* En-tête compact */}
                  <div className="flex items-start space-x-2 mb-3">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer"
                        title={file.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.url, '_blank');
                        }}
                      >
                        {file.name}
                      </h3>
                    </div>
                  </div>

                  {/* Métadonnées compactes */}
                  <div className="space-y-2">
                    {/* Date */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Date</span>
                      </div>
                      {editing?.fileId === file.id && editing.field === 'date' ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="date"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white w-24"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white p-0.5"
                            title="Sauvegarder"
                          >
                            <Save className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="hover:bg-red-50 hover:text-red-600 p-0.5"
                            title="Annuler"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 group/date">
                          <span className="text-gray-700 font-medium">
                            {formatDate(file.document_date)}
                          </span>
                          {onUpdateFile && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                const date = new Date(file.document_date);
                                const formattedDate = date.toISOString().split('T')[0];
                                handleEdit(file.id, 'date', formattedDate);
                              }}
                              className="opacity-0 group-hover/date:opacity-100 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 p-0.5"
                              title="Modifier la date"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Montant */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-gray-500">
                        <EuroIcon className="h-3 w-3 mr-1" />
                        <span>Montant</span>
                      </div>
                      {editing?.fileId === file.id && editing.field === 'amount' ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.01"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="w-16 text-xs border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white p-0.5"
                            title="Sauvegarder"
                          >
                            <Save className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="hover:bg-red-50 hover:text-red-600 p-0.5"
                            title="Annuler"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 group/amount">
                          <span className="font-semibold text-blue-600">
                            {file.amount ? formatAmount(file.amount) : 'N/A'}
                          </span>
                          {onUpdateFile && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(file.id, 'amount', file.amount?.toString() || '0');
                              }}
                              className="opacity-0 group-hover/amount:opacity-100 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 p-0.5"
                              title="Modifier le montant"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions en bas */}
                  <div className="mt-3 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                    <FileActions
                      file={file}
                      onDelete={() => setSelectedFile(file)}
                    />
                  </div>
                </div>
              </motion.div>
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
    </>
  );
}