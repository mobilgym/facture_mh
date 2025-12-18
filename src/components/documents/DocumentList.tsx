import React, { useState } from 'react';
import { useFiles } from '@/hooks/useFiles';
import { formatFileSize, formatDate } from '@/lib/utils';
import { FileText, Image, FileSpreadsheet } from 'lucide-react';
import DocumentActions from './DocumentActions';
import DocumentShare from './DocumentShare';
import type { FileItem } from '@/types/file';

interface DocumentListProps {
  categoryId: string | null;
}

export default function DocumentList({ categoryId }: DocumentListProps) {
  const { files, loading, error } = useFiles({ folderId: categoryId });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf') || type.includes('word')) return FileText;
    if (type.includes('image')) return Image;
    if (type.includes('excel')) return FileSpreadsheet;
    return FileText;
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(file => file.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
    setSelectAll(newSelected.size === files.length);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        Une erreur est survenue lors du chargement des documents
      </div>
    );
  }

  return (
    <div className="space-y-4 budget-container">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center min-w-0">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
            className="h-4 w-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
          />
          <span className="ml-2 text-fit-xs text-gray-600 truncate">
            {selectedFiles.size} document(s) sélectionné(s)
          </span>
        </div>
        {selectedFiles.size > 0 && (
          <DocumentShare
            files={files.filter(file => selectedFiles.has(file.id))}
            onClose={() => setSelectedFiles(new Set())}
          />
        )}
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {files.map((file) => {
          const Icon = getFileIcon(file.type);
          return (
            <div key={file.id} className="glass-panel rounded-xl p-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={() => handleSelectFile(file.id)}
                  className="mt-1 h-4 w-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                />
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <Icon className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-fit-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-fit-xs text-gray-500">
                      <span className="truncate">{formatFileSize(file.size)}</span>
                      <span className="truncate">{formatDate(new Date(file.createdAt))}</span>
                    </div>
                  </div>
                </div>
                <DocumentActions file={file} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th scope="col" className="w-12 px-4 py-3">
                  <span className="sr-only">Sélection</span>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-fit-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th scope="col" className="px-4 py-3 text-left text-fit-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th scope="col" className="px-4 py-3 text-left text-fit-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'ajout
                </th>
                <th scope="col" className="relative px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map(file => {
                const Icon = getFileIcon(file.type);
                return (
                  <tr key={file.id} className="hover:bg-cyan-50/30">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={() => handleSelectFile(file.id)}
                        className="h-4 w-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                      />
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <div className="flex items-center min-w-0">
                        <Icon className="h-4 w-4 text-cyan-500 mr-2 shrink-0" />
                        <div className="text-fit-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-fit-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-fit-sm text-gray-500">
                      {formatDate(new Date(file.createdAt))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <DocumentActions file={file} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
