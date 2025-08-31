import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Building2, EuroIcon, FileText, Tag } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanies } from '@/hooks/useCompanies';
import { useBudgets } from '@/hooks/useBudgets';
import { useBudgetBadges } from '@/hooks/useBudgetBadges';
import Button from '@/components/ui/Button';
import { DocumentType } from './TypeSelectionDialog';
import { BudgetBubbleSelector } from '@/components/budgets/BudgetBubbleSelector';
import { BadgeBubbleSelector } from '@/components/badges/BadgeBubbleSelector';
import type { Badge } from '@/types/badge';
import MultiAssignmentManager, { AssignmentItem } from './MultiAssignmentManager';

interface ManualInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    documentType: DocumentType;
    fileName: string;
    date: Date;
    amount: number | null;
    budgetId?: string | null;
    badgeIds?: string[];
    multiAssignments?: any[];
  }) => void;
}

export default function ManualInvoiceDialog({ isOpen, onClose, onConfirm }: ManualInvoiceDialogProps) {
  const { user } = useAuth();
  const { companies } = useCompanies();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { budgets, loading: budgetsLoading } = useBudgets();
  
  // États principaux
  const [documentType, setDocumentType] = useState<DocumentType>('achat');
  const [fileName, setFileName] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [amount, setAmount] = useState<string>('');
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null);
  const [badgeIds, setBadgeIds] = useState<string[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<Badge[]>([]);
  
  // États pour le système d'assignation multiple
  const [useMultiAssignment, setUseMultiAssignment] = useState(false);
  const [multiAssignments, setMultiAssignments] = useState<AssignmentItem[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  
  const { badges: availableBadges, loading: badgesLoading } = useBudgetBadges(budgetId || undefined);

  // Mise à jour du nom de fichier selon le type
  useEffect(() => {
    if (documentType) {
      const prefix = documentType === 'achat' ? 'Ach_' : 'Vte_';
      const dateStr = format(date, 'dd-MM-yyyy');
      setFileName(`${prefix}manuel_${dateStr}.pdf`);
    }
  }, [documentType, date]);

  // Réinitialiser les états à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setDocumentType('achat');
      setAmount('');
      setBudgetId(null);
      setSelectedBudget(null);
      setBadgeIds([]);
      setSelectedBadges([]);
      setUseMultiAssignment(false);
      setMultiAssignments([]);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Gestionnaires de budget
  const handleBudgetSelect = (budget: any) => {
    setSelectedBudget(budget);
    setBudgetId(budget.id);
    setBadgeIds([]);
    setSelectedBadges([]);
  };

  const handleBudgetRemove = () => {
    setSelectedBudget(null);
    setBudgetId(null);
    setBadgeIds([]);
    setSelectedBadges([]);
  };

  // Gestionnaires de badges
  const handleBadgeSelect = (badge: Badge) => {
    if (!badgeIds.includes(badge.id)) {
      setBadgeIds([...badgeIds, badge.id]);
      setSelectedBadges(prev => [...prev, badge]);
    }
  };

  const handleBadgeRemove = (badgeId: string) => {
    setBadgeIds(badgeIds.filter(id => id !== badgeId));
    setSelectedBadges(prev => prev.filter(badge => badge.id !== badgeId));
  };

  // Filtrer les budgets actifs
  const activeBudgets = budgets?.filter(budget => budget.is_active === true) || [];
  const allBudgetsIfNeeded = activeBudgets.length === 0 ? (budgets || []) : activeBudgets;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      setError('Veuillez sélectionner une société');
      return;
    }

    if (!date) {
      setError('Veuillez sélectionner une date');
      return;
    }

    if (!fileName.trim()) {
      setError('Veuillez saisir un nom de fichier');
      return;
    }

    // Validation selon le mode d'assignation
    if (useMultiAssignment) {
      if (multiAssignments.length === 0) {
        setError('Veuillez configurer au moins une assignation budget/badge');
        return;
      }
      
      const invalidAssignments = multiAssignments.filter(a => !a.budgetId || !a.badgeId);
      if (invalidAssignments.length > 0) {
        setError('Chaque assignation doit avoir un budget et un badge sélectionnés');
        return;
      }
      
      const totalPercentage = multiAssignments.reduce((sum, a) => sum + a.percentage, 0);
      if (totalPercentage > 100) {
        setError(`Le total des pourcentages (${totalPercentage}%) dépasse 100%`);
        return;
      }
    } else {
      if (badgeIds.length > 0 && !budgetId) {
        setError('Veuillez sélectionner un budget si vous voulez assigner des badges');
        return;
      }
    }

    const parsedAmount = amount ? parseFloat(amount) : null;
    
    if (amount && (isNaN(parsedAmount!) || parsedAmount! < 0)) {
      setError('Le montant doit être un nombre positif');
      return;
    }

    setError(null);
    
    if (useMultiAssignment) {
      onConfirm({
        documentType,
        fileName,
        date,
        amount: parsedAmount,
        multiAssignments
      });
    } else {
      onConfirm({
        documentType,
        fileName,
        date,
        amount: parsedAmount,
        budgetId,
        badgeIds
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Ajouter une facture manuellement</h2>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Type de document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de document
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setDocumentType('achat')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  documentType === 'achat'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">Achat</div>
                  <div className="text-xs text-gray-500">Facture fournisseur</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDocumentType('vente')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  documentType === 'vente'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">Vente</div>
                  <div className="text-xs text-gray-500">Facture client</div>
                </div>
              </button>
            </div>
          </div>

          {/* Société */}
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

          {/* Nom du fichier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de référence
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Nom qui apparaîtra dans votre liste de documents
            </p>
          </div>

          {/* Date */}
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

          {/* Montant */}
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Tag className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  Attribution budgétaire (optionnel)
                </span>
              </div>
              
              {/* Toggle entre mode simple et multiple */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Simple</span>
                <button
                  type="button"
                  onClick={() => {
                    setUseMultiAssignment(!useMultiAssignment);
                    if (!useMultiAssignment) {
                      setBudgetId(null);
                      setBadgeIds([]);
                      setMultiAssignments([]);
                    } else {
                      setMultiAssignments([]);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    useMultiAssignment ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      useMultiAssignment ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-500">Multiple</span>
              </div>
            </div>

            {useMultiAssignment ? (
              /* Mode Assignation Multiple */
              <div>
                <div className="mb-3">
                  <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                    <strong>Mode Multiple :</strong> Répartissez votre facture sur plusieurs budgets et badges avec des pourcentages personnalisés.
                  </p>
                </div>
                
                <MultiAssignmentManager
                  totalAmount={parseFloat(amount) || 0}
                  assignments={multiAssignments}
                  onAssignmentsChange={setMultiAssignments}
                />
              </div>
            ) : (
              /* Mode Simple */
              <div>
                {/* Sélection du Budget */}
                <div className="mb-6">
                  <BudgetBubbleSelector
                    budgets={allBudgetsIfNeeded}
                    selectedBudget={selectedBudget}
                    onBudgetSelect={handleBudgetSelect}
                    onBudgetRemove={handleBudgetRemove}
                    loading={budgetsLoading}
                    disabled={!selectedCompany}
                  />
                  {!budgetsLoading && (!allBudgetsIfNeeded || allBudgetsIfNeeded.length === 0) && (
                    <p className="text-xs text-amber-600 mt-2">
                      Aucun budget actif disponible. Vous pouvez en créer dans la section "Budgets et Dépenses".
                    </p>
                  )}
                </div>

                {/* Sélection des Badges */}
                {budgetId && (
                  <div>
                    <BadgeBubbleSelector
                      badges={availableBadges || []}
                      selectedBadges={selectedBadges}
                      onBadgeSelect={handleBadgeSelect}
                      onBadgeRemove={handleBadgeRemove}
                      loading={badgesLoading}
                      disabled={!budgetId}
                    />
                    {budgetId && (!availableBadges || availableBadges.length === 0) && !badgesLoading && (
                      <p className="text-xs text-amber-600 mt-2">
                        Aucun badge disponible pour ce budget. 
                        Vous pouvez en créer dans la section "Budgets et Dépenses".
                      </p>
                    )}
                  </div>
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
              Ajouter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}