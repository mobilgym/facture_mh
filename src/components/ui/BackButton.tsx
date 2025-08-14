import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from './Button';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

export default function BackButton({ onClick, className }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`flex items-center text-gray-600 hover:text-gray-900 ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Retour
    </Button>
  );
}