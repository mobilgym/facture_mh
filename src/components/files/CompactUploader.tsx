import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, Edit, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
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
  const [bgUploads, setBgUploads] = useState<{ id: number; name: string; status: 'uploading' | 'success' | 'error'; message?: string }[]>([]);

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

  const handleImportConfirm = (processedFile: File, fileName: string, date: Date, amount: number | null, budgetId?: string | null, badgeIds?: string[], multiAssignments?: any[]) => {
    setFileToImport(null);
    setSelectedType(null);

    const uploadId = Date.now();
    setBgUploads(prev => [...prev, { id: uploadId, name: fileName, status: 'uploading' }]);

    upload(processedFile, fileName, date, amount, budgetId, badgeIds, multiAssignments)
      .then(() => {
        setBgUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'success' } : u));
        onSuccess();
        setTimeout(() => setBgUploads(prev => prev.filter(u => u.id !== uploadId)), 3000);
      })
      .catch((err: any) => {
        setBgUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', message: err?.message } : u));
        setTimeout(() => setBgUploads(prev => prev.filter(u => u.id !== uploadId)), 5000);
      });
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
        onConfirm={(data) => {
          setShowManualDialog(false);
          const virtualFile = new File([''], data.fileName, { type: 'application/pdf' });
          const uploadId = Date.now();
          setBgUploads(prev => [...prev, { id: uploadId, name: data.fileName, status: 'uploading' }]);

          upload(virtualFile, data.fileName, data.date, data.amount, data.budgetId, data.badgeIds, data.multiAssignments)
            .then(() => {
              setBgUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'success' } : u));
              onSuccess();
              setTimeout(() => setBgUploads(prev => prev.filter(u => u.id !== uploadId)), 3000);
            })
            .catch((err: any) => {
              setBgUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', message: err?.message } : u));
              setTimeout(() => setBgUploads(prev => prev.filter(u => u.id !== uploadId)), 5000);
            });
        }}
      />

      {/* Background upload toasts */}
      {bgUploads.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[90] space-y-2">
          <AnimatePresence>
            {bgUploads.map(u => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border backdrop-blur-sm max-w-xs ${
                  u.status === 'uploading' ? 'bg-white/95 border-blue-200'
                    : u.status === 'success' ? 'bg-green-50/95 border-green-200'
                    : 'bg-red-50/95 border-red-200'
                }`}
              >
                {u.status === 'uploading' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />}
                {u.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                {u.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-[10px] text-gray-500">
                    {u.status === 'uploading' && 'Import en cours...'}
                    {u.status === 'success' && 'Import\u00e9 avec succ\u00e8s'}
                    {u.status === 'error' && (u.message || 'Erreur')}
                  </p>
                </div>
                <button onClick={() => setBgUploads(prev => prev.filter(x => x.id !== u.id))} className="p-0.5 hover:bg-gray-200/60 rounded flex-shrink-0">
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}