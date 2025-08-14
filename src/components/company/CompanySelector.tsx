import React, { useState } from 'react';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanies } from '@/hooks/useCompanies';
import Button from '@/components/ui/Button';
import CreateCompanyModal from './CreateCompanyModal';

export default function CompanySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { companies, loading, refetch } = useCompanies();

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-9 w-full sm:w-48 bg-gray-200 rounded-md" />
      </div>
    );
  }

  return (
    <div className="relative w-full sm:w-auto">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="w-full sm:w-auto flex items-center justify-between gap-2 min-w-[200px]"
      >
        <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="truncate flex-1 text-left">
          {selectedCompany?.name || 'Sélectionner une société'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-full sm:w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-40">
            <div className="py-1">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 ${
                    selectedCompany?.id === company.id
                      ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700'
                      : 'text-gray-700'
                  }`}
                >
                  {company.name}
                </button>
              ))}
              
              <div className="border-t mt-1 pt-1">
                <Button
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setIsOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-sm px-4 py-2 text-cyan-600 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle société
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <CreateCompanyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}