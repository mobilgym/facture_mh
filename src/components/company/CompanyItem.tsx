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
      className={`px-3 sm:px-4 py-2 flex items-center gap-3 hover:bg-cyan-50/50 transition-colors budget-container ${
        isSelected ? 'bg-cyan-50/60' : ''
      }`}
    >
      <button
        onClick={() => onSelect(company)}
        className="flex-1 flex items-center gap-3 min-w-0"
      >
        <Building2 className="h-4 w-4 text-cyan-500 shrink-0" />
        <span className="text-fit-sm font-medium text-gray-800 truncate">{company.name}</span>
        {isSelected && (
          <span className="w-2 h-2 bg-cyan-500 rounded-full shrink-0" />
        )}
      </button>
      <div className="shrink-0">
        <CompanyActions
          company={company}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
