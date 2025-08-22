import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import Button from '@/components/ui/Button';
import FileImportDialog from './FileImportDialog';
import TypeSelectionDialog, { DocumentType } from './TypeSelectionDialog';
import UploadProgress from './UploadProgress';

interface FileUploaderProps {
  folderId: string | null;
  onSuccess: () => void;
}

export default function FileUploader({ folderId, onSuccess }: FileUploaderProps) {
  const { upload, uploading, progress, converting } = useFileUpload(folderId);
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

  return (
    <div className="mb-8">
      <motion.div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        animate={{
          scale: isDragActive ? 1.02 : 1,
          borderColor: isDragActive ? '#3B82F6' : '#D1D5DB'
        }}
      >
        <input {...getInputProps()} />
        
        <div className="p-6 md:p-12 text-center">
          <motion.div
            animate={{ 
              scale: isDragActive ? 1.1 : 1,
              y: isDragActive ? -5 : 0
            }}
            transition={{ type: "spring", stiffness: 300 }}
            className="md:mb-4"
          >
            <Upload
              className={`mx-auto h-8 w-8 md:h-12 md:w-12 ${
                isDragActive ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
          </motion.div>

          <AnimatePresence>
            {uploading || converting ? (
              <UploadProgress progress={progress} isConverting={converting} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Button type="button" size="sm" className="mt-2 md:mt-4">
                  {isDragActive ? 'Déposez ici' : 'Importer'}
                </Button>
                <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-500 hidden md:block">
                  PDF, Images (JPG, PNG - converties en PDF), Documents (DOC, DOCX)
                </p>
                <p className="text-xs md:text-sm text-gray-500 hidden md:block">
                  Taille maximale : 100 MB
                </p>
                <p className="mt-1 text-xs text-gray-500 md:hidden">
                  PDF, Images → PDF, Docs (max. 100MB)
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
          <FileImportDialog
            file={fileToImport}
            documentType={selectedType}
            isOpen={true}
            onClose={() => {
              setFileToImport(null);
              setSelectedType(null);
              setError(null);
            }}
            onConfirm={async (processedFile, fileName, date, amount, budgetId, badgeIds, multiAssignments) => {
              try {
                await upload(processedFile, fileName, date, amount, budgetId, badgeIds, multiAssignments);
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