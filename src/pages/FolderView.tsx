import React from 'react';
import { useParams } from 'react-router-dom';
import FileUploader from '@/components/files/FileUploader';
import FileList from '@/components/files/FileList';
import FileSearch from '@/components/files/FileSearch';
import FolderStats from '@/components/folders/FolderStats';
import FolderTags from '@/components/folders/FolderTags';

export default function FolderView() {
  const { folderId } = useParams();
  const [filter, setFilter] = React.useState({
    search: '',
    date: null,
    type: null
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <FileUploader folderId={folderId || null} onSuccess={() => {}} />
          <FileSearch onFilterChange={setFilter} />
          <FileList folderId={folderId || null} filter={filter} />
        </div>
        
        <div className="space-y-6">
          <FolderStats folderId={folderId || null} />
          {folderId && <FolderTags folderId={folderId} />}
        </div>
      </div>
    </main>
  );
}