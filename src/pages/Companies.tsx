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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-3 md:p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Gestion des sociétés
            </h1>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Nouvelle société</span>
            </Button>
          </div>
          
          <div className="p-3 md:p-4">
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