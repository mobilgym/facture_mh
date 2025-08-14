import React from 'react';
import { Building2 } from 'lucide-react';
import CompanyActions from './CompanyActions';
import type { Company } from '@/types/company';

interface CompanyItemProps {
  company: Company;
  isSelected: boolean;
  onSelect: (company: Company) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CompanyItem({ company, isSelected, onSelect, onEdit, onDelete }: CompanyItemProps) {
  return (
    <div
      className={`px-4 py-2 flex items-center space-x-3 hover:bg-gray-100 ${
        isSelected ? 'bg-gray-50' : ''
      }`}
    >
      <button
        onClick={() => onSelect(company)}
        className="flex-1 flex items-center space-x-3"
      >
        <Building2 className="h-5 w-5 text-gray-400" />
        <span>{company.name}</span>
        {isSelected && (
          <span className="w-2 h-2 bg-blue-600 rounded-full" />
        )}
      </button>
      <CompanyActions
        company={company}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}