import React, { useState } from 'react';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanies } from '@/hooks/useCompanies';
import Button from '@/components/ui/Button';
import CreateCompanyModal from './CreateCompanyModal';

export default function CompactCompanySelector() {
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
        <div className="h-8 w-8 bg-gray-200 rounded-md" />
      </div>
    );
  }

  // Obtenir les initiales de la société sélectionnée
  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="p-2 h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
        title={selectedCompany?.name || 'Sélectionner une société'}
      >
        {selectedCompany ? (
          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 flex items-center justify-center">
            <span className="text-xs font-medium text-cyan-700">
              {getCompanyInitials(selectedCompany.name)}
            </span>
          </div>
        ) : (
          <Building2 className="h-4 w-4 text-gray-500" />
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-40">
            <div className="py-1">
              {companies.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Aucune société disponible
                </div>
              ) : (
                companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelectCompany(company)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                      selectedCompany?.id === company.id ? 'bg-cyan-50 text-cyan-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-cyan-700">
                        {getCompanyInitials(company.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{company.name}</div>
                      {company.address && (
                        <div className="truncate text-xs text-gray-500">{company.address}</div>
                      )}
                    </div>
                  </button>
                ))
              )}
              
              <div className="border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-3 w-3 text-gray-500" />
                  </div>
                  <span>Créer une nouvelle société</span>
                </button>
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