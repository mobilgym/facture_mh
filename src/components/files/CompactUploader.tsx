import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import FileImportDialog from './FileImportDialog';
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
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

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

  const handleImportConfirm = async (fileName: string, date: Date, amount: number | null, budgetId?: string | null, badgeIds?: string[]) => {
    if (!fileToImport) return;
    
    try {
      await upload(fileToImport, fileName, date, amount, budgetId, badgeIds);
      setFileToImport(null);
      setSelectedType(null);
      onSuccess();
    } catch (err) {
      setError('Erreur lors de l\'upload');
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
        <input {...getInputProps()} />
        
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
                <Button type="button" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {isDragActive ? 'Déposer' : 'Importer'}
                </Button>
                <p className="mt-1 text-xs text-gray-500">
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
    </>
  );
}