import React, { useState, useEffect } from 'react';

interface FileImportDialogProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
}

export default function FileImportDialog({ file, isOpen, onClose }: FileImportDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg mx-auto max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Test Modal</h2>
          <p>Fichier: {file.name}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
