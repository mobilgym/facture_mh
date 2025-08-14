import React, { useState } from 'react';
import { Share2, Copy, Mail } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { FileItem } from '@/types/file';

interface DocumentShareProps {
  files: FileItem[];
  onClose: () => void;
}

export default function DocumentShare({ files, onClose }: DocumentShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLinks = async () => {
    const links = files.map(file => file.url).join('\n');
    await navigator.clipboard.writeText(links);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('Documents partagés');
    const body = encodeURIComponent(
      'Voici les liens vers les documents :\n\n' +
      files.map(file => `${file.name}: ${file.url}`).join('\n')
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <Share2 className="h-4 w-4" />
        <span>Partager</span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-40">
            <div className="py-1">
              <button
                onClick={handleCopyLinks}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Copy className="h-4 w-4 mr-3" />
                {copied ? 'Liens copiés !' : 'Copier les liens'}
              </button>
              <button
                onClick={handleEmailShare}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Mail className="h-4 w-4 mr-3" />
                Partager par email
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}