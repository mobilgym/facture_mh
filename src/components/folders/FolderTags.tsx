import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { useFolderTags } from '@/hooks/useFolderTags';
import Button from '@/components/ui/Button';

interface FolderTagsProps {
  folderId: string;
}

export default function FolderTags({ folderId }: FolderTagsProps) {
  const { tags, loading, error, addTag, removeTag } = useFolderTags(folderId);
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    try {
      await addTag(newTag.trim());
      setNewTag('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg p-4 shadow">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Tag className="h-5 w-5 mr-2 text-blue-500" />
          Tags
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="text-blue-600"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddTag} className="mb-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nouveau tag..."
              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" size="sm">
              Ajouter
            </Button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-sm"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 p-0.5 hover:bg-blue-100 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-gray-500">
            Aucun tag
          </p>
        )}
      </div>
    </div>
  );
}