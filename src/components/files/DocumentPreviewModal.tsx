import React, { useEffect } from 'react';
import { ExternalLink, Eye, FileText, Image as ImageIcon, X } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface PreviewDocument {
  name: string;
  url: string;
  type?: string | null;
}

interface DocumentPreviewModalProps {
  previewDocument: PreviewDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

const isImageType = (type?: string | null) => Boolean(type?.startsWith('image/'));
const isPdfType = (type?: string | null, url?: string) =>
  type === 'application/pdf' || Boolean(url?.toLowerCase().includes('.pdf'));

export default function DocumentPreviewModal({
  previewDocument,
  isOpen,
  onClose
}: DocumentPreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = globalThis.document.body.style.overflow;
    globalThis.document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      globalThis.document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !previewDocument) return null;

  const isImage = isImageType(previewDocument.type);
  const isPdf = isPdfType(previewDocument.type, previewDocument.url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Apercu du document"
    >
      <div
        className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Apercu rapide
            </p>
            <h2 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
              {previewDocument.name}
            </h2>
          </div>

          <div className="ml-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewDocument.url, '_blank', 'noopener,noreferrer')}
              className="hidden sm:inline-flex"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ouvrir en grand
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100">
          {isImage && (
            <div className="flex h-full items-center justify-center p-4">
              <img
                src={previewDocument.url}
                alt={previewDocument.name}
                className="max-h-full max-w-full rounded-xl bg-white object-contain shadow-lg"
              />
            </div>
          )}

          {isPdf && (
            <iframe
              src={previewDocument.url}
              title={previewDocument.name}
              className="h-full w-full border-0 bg-white"
            />
          )}

          {!isImage && !isPdf && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="rounded-full bg-white p-4 shadow">
                {previewDocument.type ? (
                  <ImageIcon className="h-8 w-8 text-slate-500" />
                ) : (
                  <FileText className="h-8 w-8 text-slate-500" />
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Apercu integre non disponible</p>
                <p className="mt-1 text-sm text-slate-600">
                  Ce format ne peut pas etre affiche directement dans la popup.
                </p>
              </div>
              <Button onClick={() => window.open(previewDocument.url, '_blank', 'noopener,noreferrer')}>
                <Eye className="mr-2 h-4 w-4" />
                Ouvrir le document
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(previewDocument.url, '_blank', 'noopener,noreferrer')}
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ouvrir en grand
          </Button>
        </div>
      </div>
    </div>
  );
}
