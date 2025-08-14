import React from 'react';
import { MoreVertical, Pencil, Trash2, FolderInput } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { Folder } from '@/types/file';

interface FolderActionsProps {
  folder: Folder;
  onRename: () => void;
  onDelete: () => void;
  onMoveFiles: () => void;
}

export default function FolderActions({ folder, onRename, onDelete, onMoveFiles }: FolderActionsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="p-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-40">
            <div className="py-1">
              <button
                onClick={() => {
                  onRename();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Renommer
              </button>
              <button
                onClick={() => {
                  onMoveFiles();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FolderInput className="h-4 w-4 mr-2" />
                Déplacer les fichiers
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}