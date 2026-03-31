import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, AlertCircle, Edit, CheckCircle, Loader2 } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import Button from '@/components/ui/Button';
import FileImportDialog from './FileImportDialog';
import ManualInvoiceDialog from './ManualInvoiceDialog';
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
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
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

  return (
    <div className="mb-4">
      <motion.div
        {...getRootProps()}
        className={`relative rounded-2xl transition-all overflow-hidden ${
          isDragActive
            ? 'shadow-[0_0_30px_rgba(6,182,212,0.3)]'
            : 'shadow-sm hover:shadow-md'
        }`}
        animate={{
          scale: isDragActive ? 1.02 : 1,
        }}
      >
        {/* Gradient border effect */}
        <div className={`absolute inset-0 rounded-2xl transition-opacity ${
          isDragActive ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 p-[2px]`}>
          <div className="w-full h-full bg-white rounded-2xl" />
        </div>

        <div className={`relative rounded-2xl border-2 border-dashed transition-colors ${
          isDragActive
            ? 'border-transparent bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50'
            : 'border-gray-200 bg-gradient-to-br from-gray-50/50 to-white'
        }`}>
          <input {...getInputProps()} />

          <div className="p-5 md:p-8 text-center">
            <motion.div
              animate={{
                scale: isDragActive ? 1.15 : 1,
                y: isDragActive ? -8 : 0
              }}
              transition={{ type: "spring", stiffness: 300 }}
              className="mb-3"
            >
              <div className={`mx-auto w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${
                isDragActive
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-200'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}>
                <Upload className={`h-5 w-5 md:h-6 md:w-6 ${isDragActive ? 'text-white' : 'text-gray-500'}`} />
              </div>
            </motion.div>

            <AnimatePresence>
              {uploading || converting ? (
                <UploadProgress progress={progress} isConverting={converting} />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {isDragActive ? 'D\u00e9posez votre fichier' : 'Glissez un fichier ou'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <Button type="button" size="sm" className="px-5">
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      Importer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowManualDialog(true)}
                      className="flex items-center gap-2 px-4"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Saisie manuelle
                    </Button>
                  </div>
                  <p className="mt-3 text-[10px] text-gray-400">
                    PDF, Images, Word &bull; Max 100 MB
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-3 mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="flex-1 text-xs text-red-600">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="h-3.5 w-3.5" />
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
            onConfirm={(processedFile, fileName, date, amount, budgetId, badgeIds, multiAssignments) => {
              // Fermer le dialogue immédiatement
              setFileToImport(null);
              setSelectedType(null);

              // Lancer l'upload en arrière-plan
              const uploadId = Date.now();
              setBgUploads(prev => [...prev, { id: uploadId, name: fileName, status: 'uploading' }]);

              upload(processedFile, fileName, date, amount, budgetId, badgeIds, multiAssignments)
                .then(() => {
                  setBgUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'success' } : u));
                  onSuccess();
                  setTimeout(() => {
                    setBgUploads(prev => prev.filter(u => u.id !== uploadId));
                  }, 3000);
                })
                .catch((err: any) => {
                  setBgUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', message: err.message } : u));
                  setTimeout(() => {
                    setBgUploads(prev => prev.filter(u => u.id !== uploadId));
                  }, 5000);
                });
            }}
          />
        )}
      </AnimatePresence>

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
              setBgUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', message: err.message } : u));
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
                  u.status === 'uploading'
                    ? 'bg-white/95 border-blue-200'
                    : u.status === 'success'
                      ? 'bg-green-50/95 border-green-200'
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
                <button
                  onClick={() => setBgUploads(prev => prev.filter(x => x.id !== u.id))}
                  className="p-0.5 hover:bg-gray-200/60 rounded flex-shrink-0"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
