import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, FileText, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import type { CreateBudgetForm, BudgetWithStats } from '../../types/budget';
import type { Badge } from '../../types/badge';
import { useBadges } from '../../hooks/useBadges';
import { useBudgetBadges } from '../../hooks/useBudgetBadges';
import { BadgeService } from '../../lib/services/badgeService';
import { useAuth } from '../../contexts/AuthContext';

interface BudgetFormProps {
  budget?: BudgetWithStats | null;
  onSubmit: (data: CreateBudgetForm, badgeIds?: string[]) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function BudgetForm({ budget, onSubmit, onClose, isLoading = false }: BudgetFormProps) {
  const [formData, setFormData] = useState<CreateBudgetForm>({
    name: '',
    description: '',
    initial_amount: 0,
    start_date: '',
    end_date: ''
  });
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    dates: false,
    badges: false
  });
  
  const { activeBadges } = useBadges();
  const { badges: budgetBadges } = useBudgetBadges(budget?.id);
  const { user } = useAuth();

  const [errors, setErrors] = useState<Partial<CreateBudgetForm>>({});

  // Pré-remplir le formulaire si on édite un budget
  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        description: budget.description || '',
        initial_amount: budget.initial_amount,
        start_date: budget.start_date || '',
        end_date: budget.end_date || ''
      });
    }
  }, [budget]);

  // Pré-remplir les badges sélectionnés
  useEffect(() => {
    if (budgetBadges) {
      setSelectedBadges(budgetBadges.map(badge => badge.id));
    }
  }, [budgetBadges]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateBudgetForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (formData.initial_amount <= 0) {
      newErrors.initial_amount = 'Le montant doit être supérieur à 0';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'La date de fin doit être postérieure à la date de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Tentative de soumission du formulaire avec:', formData);
    console.log('🔍 Badges sélectionnés:', selectedBadges);
    
    if (!validateForm()) {
      console.log('❌ Validation du formulaire échouée');
      return;
    }

    console.log('✅ Validation du formulaire réussie, soumission...');
    try {
      if (budget) {
        // Mode édition : le hook gère séparément la mise à jour des catégories
        await onSubmit(formData);
        if (user) {
          console.log('🔄 Mise à jour des badges du budget');
          await BadgeService.updateBudgetBadges(
            budget.id,
            selectedBadges,
            user.id
          );
        }
      } else {
        // Mode création : passer les badges à la fonction de création
        await onSubmit(formData, selectedBadges);
      }
      
      console.log('✅ Soumission réussie, fermeture du formulaire');
      onClose();
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field: keyof CreateBudgetForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-medium text-gray-900">
            {budget ? 'Modifier le budget' : 'Créer un nouveau budget'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Informations de base */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('basicInfo')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium text-gray-900">Informations de base</span>
              </div>
              {expandedSections.basicInfo ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.basicInfo && (
              <div className="p-4 border-t border-gray-200 space-y-4">
                {/* Nom */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du budget *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nom du budget"
                      required
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Description du budget (optionnel)"
                  />
                </div>

                {/* Montant initial */}
                <div>
                  <label htmlFor="initial_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Montant initial *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      id="initial_amount"
                      value={formData.initial_amount}
                      onChange={(e) => handleInputChange('initial_amount', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.initial_amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      €
                    </span>
                  </div>
                  {errors.initial_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.initial_amount}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Dates */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('dates')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium text-gray-900">Période du budget</span>
              </div>
              {expandedSections.dates ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.dates && (
              <div className="p-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  {/* Date de début */}
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date de début
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        id="start_date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Date de fin */}
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date de fin
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        id="end_date"
                        value={formData.end_date}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.end_date ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.end_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Badges autorisés */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('badges')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Tag className="h-5 w-5 text-purple-600 mr-3" />
                <span className="font-medium text-gray-900">
                  Badges autorisés
                  {selectedBadges.length > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      {selectedBadges.length} sélectionné{selectedBadges.length > 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              </div>
              {expandedSections.badges ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.badges && (
              <div className="p-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez les badges qui pourront être utilisés avec ce budget.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activeBadges.map((badge) => (
                    <label
                      key={badge.id}
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBadges.includes(badge.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBadges(prev => [...prev, badge.id]);
                          } else {
                            setSelectedBadges(prev => prev.filter(id => id !== badge.id));
                          }
                        }}
                        className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <div className="ml-3 flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: badge.color }}
                        />
                        <span className="text-sm text-gray-900">{badge.name}</span>
                        {badge.description && (
                          <span className="text-xs text-gray-500 ml-2">({badge.description})</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message d'information pour l'édition */}
          {budget && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note :</strong> Modifier le montant initial n'affectera pas les dépenses déjà enregistrées. 
                Le montant dépensé actuel est de {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(budget.spent_amount)}.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {budget ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {budget ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
