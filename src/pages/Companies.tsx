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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Gestion des sociétés
            </h1>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle société
            </Button>
          </div>
          
          <div className="p-4">
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