import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Building2, EuroIcon, FileText, FileImage, Wallet, Tag } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanies } from '@/hooks/useCompanies';
import { useBudgets } from '@/hooks/useBudgets';
import { useBudgetBadges } from '@/hooks/useBudgetBadges';
import { isImageFile, getFileTypeDescription } from '@/lib/utils/imageConverter';
import Button from '@/components/ui/Button';
import { DocumentType } from './TypeSelectionDialog';
import { BadgeSelector } from '@/components/badges/BadgeSelector';
import type { Badge } from '@/types/badge';

interface FileImportDialogProps {
  file: File;
  documentType: DocumentType;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fileName: string, date: Date, amount: number | null, budgetId?: string | null, badgeIds?: string[]) => void;
}

export default function FileImportDialog({ file, documentType, isOpen, onClose, onConfirm }: FileImportDialogProps) {
  const [fileName, setFileName] = useState(() => {
    return documentType === 'achat' ? 'Ach_ .pdf' : 'Vte_ .pdf';
  });
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [amount, setAmount] = useState<string>('');
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [badgeIds, setBadgeIds] = useState<string[]>([]);
  
  const { companies } = useCompanies();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { badges: availableBadges, loading: badgesLoading } = useBudgetBadges(budgetId);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBudgetChange = (newBudgetId: string | null) => {
    setBudgetId(newBudgetId);
    // Réinitialiser les badges si le budget change
    setBadgeIds([]);
  };

  const handleBadgeSelect = (badge: Badge) => {
    if (!badgeIds.includes(badge.id)) {
      setBadgeIds([...badgeIds, badge.id]);
    }
  };

  const handleBadgeRemove = (badgeId: string) => {
    setBadgeIds(badgeIds.filter(id => id !== badgeId));
  };

  // Filtre temporaire - tous les budgets pour diagnostic
  const activeBudgets = budgets?.filter(budget => budget.is_active === true) || [];
  // Si toujours vide, essayons tous les budgets
  const allBudgetsIfNeeded = activeBudgets.length === 0 ? (budgets || []) : activeBudgets;
  const selectedBadges = availableBadges?.filter(badge => badgeIds.includes(badge.id)) || [];

  // Debug logs (temporaire)
  console.log('🔍 FileImportDialog - selectedCompany:', selectedCompany);
  console.log('🔍 FileImportDialog - budgets total:', budgets?.length);
  console.log('🔍 FileImportDialog - budgets data:', budgets);
  console.log('🔍 FileImportDialog - premier budget status:', budgets?.[0]?.status);
  console.log('🔍 FileImportDialog - premier budget is_active:', budgets?.[0]?.is_active);
  console.log('🔍 FileImportDialog - structure du premier budget:', Object.keys(budgets?.[0] || {}));
  console.log('🔍 FileImportDialog - activeBudgets count:', activeBudgets.length);
  console.log('🔍 FileImportDialog - allBudgetsIfNeeded count:', allBudgetsIfNeeded.length);
  console.log('🔍 FileImportDialog - budgetsLoading:', budgetsLoading);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      setError('Veuillez sélectionner une société');
      return;
    }

    if (!file) {
      setError('Aucun fichier à importer');
      return;
    }

    if (!date) {
      setError('Veuillez sélectionner une date');
      return;
    }

    // Validation : si un badge est sélectionné, un budget doit être sélectionné
    if (badgeIds.length > 0 && !budgetId) {
      setError('Veuillez sélectionner un budget si vous voulez assigner des badges');
      return;
    }

    const parsedAmount = amount ? parseFloat(amount) : null;
    if (amount && (isNaN(parsedAmount!) || parsedAmount! < 0)) {
      setError('Le montant doit être un nombre positif');
      return;
    }

    setError(null);
    onConfirm(fileName, date, parsedAmount, budgetId, badgeIds);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Importer le fichier</h2>
        
        {/* Informations sur le fichier */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            {isImageFile(file) ? (
              <FileImage className="h-5 w-5 text-orange-600" />
            ) : (
              <FileText className="h-5 w-5 text-blue-600" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {getFileTypeDescription(file)} • {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
          {isImageFile(file) && (
            <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
              <p className="text-xs text-orange-700 flex items-center">
                <FileImage className="h-3 w-3 mr-1" />
                Cette image sera automatiquement convertie en PDF lors de l'import
              </p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Société
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                  const company = companies.find(c => c.id === e.target.value);
                  setSelectedCompany(company || null);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner une société</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du fichier
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date du document
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={format(date, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  newDate.setHours(0, 0, 0, 0);
                  setDate(newDate);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (optionnel)
            </label>
            <div className="relative">
              <EuroIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section Budget et Badges - Optionnelle */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center mb-3">
              <Tag className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Attribution budgétaire (optionnel)
              </span>
            </div>

            {/* Sélection du Budget */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={budgetId || ''}
                  onChange={(e) => handleBudgetChange(e.target.value || null)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={budgetsLoading || !selectedCompany}
                >
                  <option value="">Aucun budget sélectionné</option>
                  {allBudgetsIfNeeded.map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name} ({(budget.initial_amount - budget.spent_amount).toFixed(2)}€ disponible)
                    </option>
                  ))}
                </select>
              </div>
              {budgetsLoading && (
                <p className="text-xs text-gray-500 mt-1">Chargement des budgets...</p>
              )}
              {!budgetsLoading && (!allBudgetsIfNeeded || allBudgetsIfNeeded.length === 0) && (
                <p className="text-xs text-amber-600 mt-1">
                  Aucun budget actif disponible. Vous pouvez en créer dans la section "Budgets et Dépenses".
                </p>
              )}
            </div>

            {/* Sélection des Badges */}
            {budgetId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badges
                </label>
                <div className="space-y-2">
                  <BadgeSelector
                    selectedBadges={selectedBadges}
                    availableBadges={availableBadges || []}
                    onBadgeSelect={handleBadgeSelect}
                    onBadgeRemove={handleBadgeRemove}
                    placeholder="Aucun badge sélectionné"
                  />
                </div>
                {badgesLoading && (
                  <p className="text-xs text-gray-500 mt-1">Chargement des badges...</p>
                )}
                {budgetId && (!availableBadges || availableBadges.length === 0) && !badgesLoading && (
                  <p className="text-xs text-amber-600 mt-1">
                    Aucun badge disponible pour ce budget. 
                    Vous pouvez en créer dans la section "Budgets et Dépenses".
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Importer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}