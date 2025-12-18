import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanies } from '@/hooks/useCompanies';
import { deleteCompany } from '@/lib/services/companyService';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import CompanyItem from './CompanyItem';
import CreateCompanyModal from './CreateCompanyModal';
import EditCompanyModal from './EditCompanyModal';
import DeleteCompanyDialog from './DeleteCompanyDialog';
import type { Company } from '@/types/company';

export default function CompanyList() {
  const { companies, loading, error, refetch } = useCompanies();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const handleDelete = async () => {
    if (!companyToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCompany(companyToDelete);
      
      // If the deleted company was selected, clear the selection
      if (selectedCompany?.id === companyToDelete.id) {
        setSelectedCompany(null);
      }
      
      await refetch();
      toast.success('Société supprimée avec succès');
    } catch (err) {
      console.error('Error deleting company:', err);
      toast.error('Erreur lors de la suppression de la société');
    } finally {
      setIsDeleting(false);
      setCompanyToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="py-1 budget-container">
        <div className="px-2 sm:px-4 py-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 neon-cta-outline px-3 py-2 text-fit-xs"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle société
          </Button>
        </div>
        
        {companies.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-fit-sm">
            Aucune société disponible
          </div>
        ) : (
          companies.map((company) => (
            <CompanyItem
              key={company.id}
              company={company}
              isSelected={selectedCompany?.id === company.id}
              onSelect={setSelectedCompany}
              onEdit={() => setCompanyToEdit(company)}
              onDelete={() => setCompanyToDelete(company)}
            />
          ))
        )}
      </div>

      <CreateCompanyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refetch}
      />

      {companyToEdit && (
        <EditCompanyModal
          company={companyToEdit}
          isOpen={true}
          onClose={() => setCompanyToEdit(null)}
          onSuccess={refetch}
        />
      )}

      <DeleteCompanyDialog
        company={companyToDelete}
        isOpen={!!companyToDelete}
        onClose={() => setCompanyToDelete(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
