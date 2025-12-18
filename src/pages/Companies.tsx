import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import Button from '@/components/ui/Button';
import CompanyList from '@/components/company/CompanyList';
import CreateCompanyModal from '@/components/company/CreateCompanyModal';

export default function Companies() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { refetch } = useCompanies();

  return (
    <div className="min-h-screen bg-gray-50 app-page budget-container">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="glass-panel-strong rounded-xl">
          <div className="p-3 sm:p-4 border-b border-cyan-100/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <h1 className="text-fit-xl font-semibold text-gray-900 tracking-tight">
              Gestion des sociétés
            </h1>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center w-full sm:w-auto justify-center neon-cta px-3 py-1.5 text-fit-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              <span className="sm:inline">Nouvelle société</span>
            </Button>
          </div>
          
          <div className="p-3 sm:p-4">
            <CompanyList />
          </div>
        </div>

        <CreateCompanyModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={refetch}
        />
      </div>
    </div>
  );
}
