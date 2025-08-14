import React from 'react';
import { Search } from 'lucide-react';

interface FileSearchProps {
  onFilterChange: (filter: { search: string; date: Date | null; type: string | null }) => void;
}

export default function FileSearch({ onFilterChange }: FileSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des factures..."
            onChange={(e) => onFilterChange({ search: e.target.value, date: null, type: null })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <input
        type="date"
        onChange={(e) => onFilterChange({ search: '', date: e.target.value ? new Date(e.target.value) : null, type: null })}
        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}