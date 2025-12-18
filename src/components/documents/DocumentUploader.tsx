import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import Button from '@/components/ui/Button';
import DocumentImportDialog from './DocumentImportDialog';
import TypeSelectionDialog, { DocumentType } from '../files/TypeSelectionDialog';
import UploadProgress from './UploadProgress';

interface DocumentUploaderProps {
  categoryId: string | null;
  onSuccess: () => void;
}

export default function DocumentUploader({ categoryId, onSuccess }: DocumentUploaderProps) {
  const { upload, uploading, progress } = useFileUpload(categoryId);
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
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  return (
    <div className="mb-4 sm:mb-6 budget-container">
      <motion.div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl transition-colors bg-white/70 backdrop-blur-xl ${
          isDragActive ? 'border-cyan-500 bg-cyan-50/70' : 'border-cyan-200/70'
        }`}
        animate={{
          scale: isDragActive ? 1.02 : 1,
          borderColor: isDragActive ? '#06B6D4' : '#A5F3FC'
        }}
      >
        <input {...getInputProps()} />
        
        <div className="p-4 sm:p-8 text-center">
          <motion.div
            animate={{ 
              scale: isDragActive ? 1.1 : 1,
              y: isDragActive ? -8 : 0
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Upload
              className={`mx-auto h-10 w-10 ${
                isDragActive ? 'text-cyan-600' : 'text-cyan-500'
              }`}
            />
          </motion.div>

          <AnimatePresence>
            {uploading ? (
              <UploadProgress progress={progress} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Button type="button" className="mt-4 neon-cta px-4 py-2">
                  {isDragActive ? 'Déposez les documents ici' : 'Importer des documents'}
                </Button>
                <p className="mt-2 text-fit-xs text-gray-500">
                  PDF, Word (DOC, DOCX), Excel (XLS, XLSX), Images (JPG, PNG)
                </p>
                <p className="text-fit-xs text-gray-500">
                  Taille maximale : 100 MB
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 p-3 bg-red-50 rounded-md flex items-start space-x-2"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-red-600">{error}</div>
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 text-red-500 hover:text-red-700"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <TypeSelectionDialog
        isOpen={showTypeDialog}
        onClose={handleTypeDialogClose}
        onSelect={handleTypeSelect}
      />

      <AnimatePresence>
        {fileToImport && selectedType && (
          <DocumentImportDialog
            file={fileToImport}
            documentType={selectedType}
            isOpen={true}
            onClose={() => {
              setFileToImport(null);
              setSelectedType(null);
              setError(null);
            }}
            onConfirm={async (fileName, category, date) => {
              try {
                await upload(fileToImport, fileName, date);
                onSuccess();
                setFileToImport(null);
                setSelectedType(null);
              } catch (err: any) {
                setError(err.message);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
