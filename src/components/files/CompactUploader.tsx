import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, Edit } from 'lucide-react';
import Button from '@/components/ui/Button';
import FileImportDialog from './FileImportDialog';
import ManualInvoiceDialog from './ManualInvoiceDialog';
import TypeSelectionDialog, { DocumentType } from './TypeSelectionDialog';
import UploadProgress from './UploadProgress';
import { useFileUpload } from '@/hooks/useFileUpload';

interface CompactUploaderProps {
  onSuccess: () => void;
}

export default function CompactUploader({ onSuccess }: CompactUploaderProps) {
  const { upload, uploading, progress, converting } = useFileUpload(null);
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setError(null);
      setFileToImport(acceptedFiles[0]);
      setShowTypeDialog(true);
    }
  }, []);

  const handleTypeSelect = (type: DocumentType) => {
    setSelectedType(type);
    setShowTypeDialog(false);
  };

  const handleTypeDialogClose = () => {
    setShowTypeDialog(false);
    setFileToImport(null);
    setSelectedType(null);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 100 * 1024 * 1024,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  const handleImportConfirm = async (processedFile: File, fileName: string, date: Date, amount: number | null, budgetId?: string | null, badgeIds?: string[], multiAssignments?: any[]) => {
    console.log('🔄 handleImportConfirm appelé avec:', { fileName, date, amount, budgetId, badgeIds });
    
    if (!fileToImport) {
      console.error('❌ Aucun fichier à importer');
      return;
    }
    
    try {
      console.log('📤 Début upload du fichier...');
      await upload(processedFile, fileName, date, amount, budgetId, badgeIds, multiAssignments);
      console.log('✅ Upload réussi !');
      setFileToImport(null);
      setSelectedType(null);
      onSuccess();
    } catch (err: any) {
      console.error('❌ Erreur upload:', err);
      setError(err?.message || 'Erreur lors de l\'upload');
    }
  };

  const handleFileDialogClose = () => {
    setFileToImport(null);
    setSelectedType(null);
  };

  return (
    <>
      <motion.div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        animate={{
          scale: isDragActive ? 1.02 : 1,
          borderColor: isDragActive ? '#3B82F6' : '#D1D5DB'
        }}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        
        <div className="p-4 text-center">
          <motion.div
            animate={{ 
              scale: isDragActive ? 1.1 : 1,
              y: isDragActive ? -2 : 0
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Upload
              className={`mx-auto h-6 w-6 mb-2 ${
                isDragActive ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
          </motion.div>

          <AnimatePresence>
            {uploading || converting ? (
              <UploadProgress progress={progress} isConverting={converting} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="space-y-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isDragActive ? 'Déposer' : 'Importer'}
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-xs text-gray-400 px-1">ou</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowManualDialog(true)}
                    className="w-full text-gray-600 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Saisie manuelle
                  </Button>
                </div>
                
                <p className="mt-2 text-xs text-gray-500">
                  PDF, Images→PDF, Docs
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-3"
            >
              <div className="bg-red-50 text-red-600 p-2 rounded text-xs">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <TypeSelectionDialog
        isOpen={showTypeDialog}
        onClose={handleTypeDialogClose}
        onSelect={handleTypeSelect}
      />

      {fileToImport && selectedType && (
        <FileImportDialog
          file={fileToImport}
          documentType={selectedType}
          isOpen={!!fileToImport && !!selectedType}
          onClose={handleFileDialogClose}
          onConfirm={handleImportConfirm}
        />
      )}

      <ManualInvoiceDialog
        isOpen={showManualDialog}
        onClose={() => setShowManualDialog(false)}
        onConfirm={async (data) => {
          try {
            // Créer un fichier virtuel pour la facture manuelle
            const virtualFile = new File([''], data.fileName, { type: 'application/pdf' });
            
            await upload(
              virtualFile,
              data.fileName,
              data.date,
              data.amount,
              data.budgetId,
              data.badgeIds,
              data.multiAssignments
            );
            
            onSuccess();
            setShowManualDialog(false);
          } catch (err: any) {
            setError(err.message || 'Erreur lors de la création de la facture manuelle');
          }
        }}
      />
    </>
  );
}