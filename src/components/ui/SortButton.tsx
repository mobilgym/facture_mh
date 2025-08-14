import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Button from './Button';

export type SortDirection = 'asc' | 'desc' | null;

interface SortButtonProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
  label: string;
}

export default function SortButton({ direction, onChange, label }: SortButtonProps) {
  const handleClick = () => {
    const nextDirection = direction === null ? 'asc' : direction === 'asc' ? 'desc' : null;
    onChange(nextDirection);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="flex items-center space-x-1 text-xs font-medium text-gray-500 hover:text-gray-700"
    >
      <span>{label}</span>
      {direction === null && <ArrowUpDown className="h-4 w-4" />}
      {direction === 'asc' && <ArrowUp className="h-4 w-4 text-blue-600" />}
      {direction === 'desc' && <ArrowDown className="h-4 w-4 text-blue-600" />}
    </Button>
  );
}