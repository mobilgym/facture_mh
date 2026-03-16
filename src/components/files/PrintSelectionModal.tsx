import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Printer, Square, X } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { formatAmount } from '@/lib/utils/currency';
import Button from '@/components/ui/Button';
import type { FileItem } from '@/types/file';

interface PrintSelectionModalProps {
  files: FileItem[];
  isOpen: boolean;
  title: string;
  initialSelectedIds?: string[];
  onClose: () => void;
  onConfirm: (selectedFiles: FileItem[]) => Promise<void> | void;
}

export default function PrintSelectionModal({
  files,
  isOpen,
  title,
  initialSelectedIds,
  onClose,
  onConfirm
}: PrintSelectionModalProps) {
  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      const dateA = new Date(a.document_date).getTime();
      const dateB = new Date(b.document_date).getTime();
      return dateB - dateA;
    });
  }, [files]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const nextSelectedIds =
      initialSelectedIds && initialSelectedIds.length > 0
        ? initialSelectedIds.filter((id) => sortedFiles.some((file) => file.id === id))
        : sortedFiles.map((file) => file.id);

    setSelectedIds(nextSelectedIds);
  }, [initialSelectedIds, isOpen, sortedFiles]);

  if (!isOpen) return null;

  const allSelected = sortedFiles.length > 0 && selectedIds.length === sortedFiles.length;

  const toggleFile = (fileId: string) => {
    setSelectedIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleToggleAll = () => {
    setSelectedIds(allSelected ? [] : sortedFiles.map((file) => file.id));
  };

  const handleConfirm = async () => {
    const selectedFiles = sortedFiles.filter((file) => selectedIds.includes(file.id));
    if (selectedFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      await onConfirm(selectedFiles);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Impression</p>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0" title="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              {selectedIds.length} facture{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}
            </p>
            <Button variant="outline" size="sm" onClick={handleToggleAll}>
              {allSelected ? <Square className="mr-2 h-4 w-4" /> : <CheckSquare className="mr-2 h-4 w-4" />}
              {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            {sortedFiles.map((file) => {
              const isSelected = selectedIds.includes(file.id);

              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => toggleFile(file.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded border ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 bg-white text-transparent'}`}>
                    <CheckSquare className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>{formatDate(file.document_date)}</span>
                      <span>{file.amount ? formatAmount(file.amount) : 'Montant non défini'}</span>
                      <span>{file.type || 'Type inconnu'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.length === 0 || isSubmitting}>
            <Printer className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Préparation...' : 'Imprimer la sélection'}
          </Button>
        </div>
      </div>
    </div>
  );
}
