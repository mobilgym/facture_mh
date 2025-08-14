import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder as FolderIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import FolderActions from './FolderActions';
import DeleteFolderDialog from './DeleteFolderDialog';
import RenameFolderDialog from './RenameFolderDialog';
import MoveFilesDialog from './MoveFilesDialog';
import type { Folder } from '@/types/file';

interface FolderCardProps {
  folder: Folder;
  onUpdate: () => void;
}

export default function FolderCard({ folder, onUpdate }: FolderCardProps) {
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow group">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/folder/${folder.id}`)}
            className="flex items-center space-x-3 flex-1 min-w-0"
          >
            <FolderIcon className="h-8 w-8 text-blue-500 group-hover:text-blue-600" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                {folder.name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDate(new Date(folder.createdAt))}
              </p>
            </div>
          </button>
          
          <FolderActions
            folder={folder}
            onRename={() => setIsRenameOpen(true)}
            onDelete={() => setIsDeleteOpen(true)}
            onMoveFiles={() => setIsMoveOpen(true)}
          />
        </div>
      </div>

      <DeleteFolderDialog
        folder={folder}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={onUpdate}
      />

      <RenameFolderDialog
        folder={folder}
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        onSuccess={onUpdate}
      />

      <MoveFilesDialog
        sourceFolder={folder}
        isOpen={isMoveOpen}
        onClose={() => setIsMoveOpen(false)}
        onSuccess={onUpdate}
      />
    </>
  );
}