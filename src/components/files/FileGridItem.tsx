import React from 'react';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils/date';
import { formatAmount } from '@/lib/utils/currency';
import { FileText, Calendar, EuroIcon, Edit3, Save, X, Wallet, Tag, Check } from 'lucide-react';
import FileActions from './FileActions';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import type { FileItem } from '@/types/file';
import type { Badge } from '@/types/badge';
import { useLongPress } from '@/hooks/useLongPress';

interface EditingState {
  fileId: string;
  field: 'amount' | 'date';
  value: string;
}

interface FileGridItemProps {
  file: FileItem;
  isSelected: boolean;
  selectionMode: boolean;
  editing: EditingState | null;
  onLongPress: (file: FileItem, event: TouchEvent | MouseEvent) => void;
  onFileClick: (file: FileItem) => void;
  onSelectFile: (fileId: string, event: React.MouseEvent) => void;
  onEdit: (fileId: string, field: 'amount' | 'date', currentValue: string) => void;
  onEditingChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteClick: (file: FileItem) => void;
  onUpdateFile?: (fileId: string, updates: Partial<FileItem>) => Promise<void>;
  onUpdate: () => void;
  getBudgetInfo: (budgetId: string) => any;
  getBadgeInfo: (badgeIds: string[]) => Badge[];
  item: any;
}

export default function FileGridItem({
  file,
  isSelected,
  selectionMode,
  editing,
  onLongPress,
  onFileClick,
  onSelectFile,
  onEdit,
  onEditingChange,
  onSave,
  onCancel,
  onDeleteClick,
  onUpdateFile,
  onUpdate,
  getBudgetInfo,
  getBadgeInfo,
  item
}: FileGridItemProps) {
  
  // Créer les handlers de pression longue pour ce fichier
  const longPressHandlers = useLongPress({
    onLongPress: (event) => onLongPress(file, event!),
    onShortPress: () => onFileClick(file),
    delay: 800
  });

  return (
    <motion.div
      variants={item}
      layoutId={file.id}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border ${
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300'
      } cursor-pointer group backdrop-blur-sm ${
        selectionMode ? 'cursor-pointer' : ''
      } select-none`}
      {...longPressHandlers}
    >
      {/* Overlay de sélection */}
      {selectionMode && (
        <div 
          className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            isSelected 
              ? 'bg-blue-500 border-blue-500' 
              : 'bg-white border-gray-300 hover:border-blue-400'
          }`}
          onClick={(e) => onSelectFile(file.id, e)}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>
      )}

      {/* Indicateurs de budget, badges et lettrage en bas à droite */}
      <div className="absolute bottom-2 right-2 flex space-x-1">
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
        
        {/* Icône de lettrage si la facture est lettrée */}
        {file.is_lettree && (
          <Tooltip
            content={
              <div className="text-center">
                <div className="font-medium">Lettrage validé</div>
                {file.lettrage_date && (
                  <div className="text-xs mt-1">
                    {new Date(file.lettrage_date).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            }
            position="bottom"
          >
            <div className="bg-gradient-to-br from-green-400 to-green-600 backdrop-blur-sm rounded-full p-1 shadow-sm border border-green-300 ring-1 ring-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.01 0 3.84.66 5.33 1.78"/>
              </svg>
            </div>
          </Tooltip>
        )}
      </div>

      <div className="p-2 pb-5">
        {/* En-tête compact */}
        <div className="flex items-start space-x-2 mb-1.5">
          <div className="flex-shrink-0">
            <div className="p-1.5 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 
              className="font-medium text-gray-900 text-[13px] leading-snug line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer"
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
        <div className="space-y-0.5">
          {/* Date */}
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Date</span>
            </div>
            {editing?.fileId === file.id && editing.field === 'date' ? (
              <div className="flex items-center space-x-1">
                <input
                  type="date"
                  value={editing.value}
                  onChange={(e) => onEditingChange(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white w-24"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={onSave}
                  className="bg-green-600 hover:bg-green-700 text-white p-0.5"
                  title="Sauvegarder"
                >
                  <Save className="h-2.5 w-2.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancel}
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
                      onEdit(file.id, 'date', formattedDate);
                    }}
                    className="h-5 w-5 p-0 opacity-0 group-hover/date:opacity-100 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
                    title="Modifier la date"
                  >
                    <Edit3 className="h-2.5 w-2.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Montant */}
          <div className="flex items-center justify-between text-[11px]">
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
                  onChange={(e) => onEditingChange(e.target.value)}
                  className="w-16 text-xs border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={onSave}
                  className="bg-green-600 hover:bg-green-700 text-white p-0.5"
                  title="Sauvegarder"
                >
                  <Save className="h-2.5 w-2.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancel}
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
                      onEdit(file.id, 'amount', file.amount?.toString() || '0');
                    }}
                    className="h-5 w-5 p-0 opacity-0 group-hover/amount:opacity-100 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
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
        <div className="mt-1 pt-1 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
          <FileActions
            file={file}
            onDelete={() => onDeleteClick(file)}
            skipAvailabilityCheck
          />
        </div>
      </div>
    </motion.div>
  );
}
