import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2, DollarSign, Tag, Calendar } from 'lucide-react';
import type { FileItem } from '../../types/file';
import type { Badge } from '../../types/badge';
import { useBudgets } from '../../hooks/useBudgets';
import { useBadges } from '../../hooks/useBadges';
import { useBudgetBadges } from '../../hooks/useBudgetBadges';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { useBudgetNotification } from '../../contexts/BudgetNotificationContext';
import { BadgeService } from '../../lib/services/badgeService';
import { BadgeBubbleSelector } from '../badges/BadgeBubbleSelector';
import { BudgetBubbleSelector } from '../budgets/BudgetBubbleSelector';

interface FileEditModalProps {
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
  onFileUpdated: () => void;
  onFileDeleted: () => void;
  onBudgetExpenseUpdated?: () => void; // Nouveau callback pour notifier les changements de dépenses
}

interface FileUpdateData {
  name: string;
  amount: number | null;
  document_date: string;
  budget_id: string | null;
  badge_ids: string[];
}

export function FileEditModal({ file, isOpen, onClose, onFileUpdated, onFileDeleted, onBudgetExpenseUpdated }: FileEditModalProps) {
  const [formData, setFormData] = useState<FileUpdateData>({
    name: '',
    amount: null,
    document_date: '',
    budget_id: null,
    badge_ids: []
  });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { budgets } = useBudgets();
  const { activeBadges } = useBadges();
  const { badges: budgetBadges } = useBudgetBadges(formData.budget_id);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<Badge[]>([]);
  const [selectedBadgesForBubbles, setSelectedBadgesForBubbles] = useState<Badge[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const { selectedCompany } = useCompany();
  const { success: showSuccess, error: showError } = useToast();
  const { notifyBudgetChange } = useBudgetNotification();

  // Mettre à jour les badges disponibles en fonction du budget sélectionné
  useEffect(() => {
    console.log('🔄 FileEditModal - useEffect badges déclenché:', {
      budget_id: formData.budget_id,
      budgetBadges: budgetBadges.length,
      isInitialized,
      current_badge_ids: formData.badge_ids
    });

    // Si un budget est sélectionné, afficher ses badges autorisés
    if (formData.budget_id) {
      setAvailableBadges(budgetBadges);
      
      // Vérifier la compatibilité des badges seulement si nous avons les badges chargés
      // et que l'initialisation est terminée
      if (isInitialized && formData.badge_ids.length > 0 && budgetBadges.length > 0) {
        const compatibleBadgeIds = formData.badge_ids.filter(badgeId => 
          budgetBadges.some(badge => badge.id === badgeId)
        );
        
        if (compatibleBadgeIds.length !== formData.badge_ids.length) {
          console.log('🔄 FileEditModal - Certains badges incompatibles avec le budget, mise à jour');
          setFormData(prev => ({
            ...prev,
            badge_ids: compatibleBadgeIds
          }));
        } else {
          console.log('✅ FileEditModal - Badges compatibles avec le budget');
        }
      }
    } else {
      // Si aucun budget n'est sélectionné, tous les badges actifs sont disponibles
      setAvailableBadges(activeBadges);
    }
  }, [formData.budget_id, budgetBadges, activeBadges, isInitialized]);

  // Initialiser le formulaire avec les données du fichier
  useEffect(() => {
    if (file) {
      console.log('🔄 FileEditModal - Initialisation avec le fichier:', file);
      console.log('🔄 FileEditModal - Budget ID du fichier:', file.budget_id);
      console.log('🔄 FileEditModal - Badge IDs du fichier:', file.badge_ids);
      
      setIsInitialized(false);
      setFormData({
        name: file.name,
        amount: file.amount || null,
        document_date: file.document_date ? file.document_date.split('T')[0] : '',
        budget_id: file.budget_id || null,
        badge_ids: file.badge_ids || []
      });
      
      // Mettre à jour le budget sélectionné pour les billes
      const currentBudget = budgets.find(budget => budget.id === file.budget_id);
      setSelectedBudget(currentBudget || null);
      
      // Marquer comme initialisé après un délai pour permettre aux autres useEffect de s'exécuter
      setTimeout(() => {
        setIsInitialized(true);
        console.log('✅ FileEditModal - Formulaire initialisé avec les données du fichier');
      }, 100);
    }
  }, [file]);

  // Mettre à jour les badges sélectionnés quand les IDs changent
  useEffect(() => {
    const badges = availableBadges.filter(badge => formData.badge_ids.includes(badge.id));
    setSelectedBadges(badges);
    setSelectedBadgesForBubbles(badges);
  }, [formData.badge_ids, availableBadges]);

  // Effet spécial pour assurer que les badges sont bien disponibles après le chargement
  useEffect(() => {
    if (isInitialized && formData.budget_id && budgetBadges.length > 0 && formData.badge_ids.length > 0) {
      // Vérifier que tous les badges sélectionnés sont bien dans la liste des badges du budget
      const availableBadgeIds = budgetBadges.map(badge => badge.id);
      const missingBadgeIds = formData.badge_ids.filter(id => !availableBadgeIds.includes(id));
      
      if (missingBadgeIds.length > 0) {
        console.log('⚠️ FileEditModal - Certains badges non trouvés dans les badges du budget');
        // Rechercher les badges manquants dans tous les badges actifs
        const missingBadges = activeBadges.filter(badge => missingBadgeIds.includes(badge.id));
        if (missingBadges.length > 0) {
          console.log('✅ FileEditModal - Badges manquants trouvés dans les badges actifs');
          // Ajouter temporairement ces badges aux badges disponibles
          setAvailableBadges([...budgetBadges, ...missingBadges]);
        }
      } else {
        console.log('✅ FileEditModal - Tous les badges trouvés dans les badges du budget');
        setAvailableBadges(budgetBadges);
      }
    }
  }, [isInitialized, formData.budget_id, formData.badge_ids, budgetBadges, activeBadges]);

  const handleInputChange = (field: keyof FileUpdateData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Gestion des badges
  const handleBadgeSelect = (badge: Badge) => {
    setFormData(prev => ({
      ...prev,
      badge_ids: [...prev.badge_ids, badge.id]
    }));
  };

  const handleBadgeRemove = (badgeId: string) => {
    setFormData(prev => ({
      ...prev,
      badge_ids: prev.badge_ids.filter(id => id !== badgeId)
    }));
  };

  // Nouveaux gestionnaires pour le système de billes
  const handleBadgeSelectNew = (badge: Badge) => {
    setSelectedBadgesForBubbles(prev => [...prev, badge]);
    setFormData(prev => ({
      ...prev,
      badge_ids: [...prev.badge_ids, badge.id]
    }));
  };

  const handleBadgeRemoveNew = (badgeId: string) => {
    setSelectedBadgesForBubbles(prev => prev.filter(badge => badge.id !== badgeId));
    setFormData(prev => ({
      ...prev,
      badge_ids: prev.badge_ids.filter(id => id !== badgeId)
    }));
  };

  // Gestionnaires pour le budget
  const handleBudgetSelectNew = (budget: any) => {
    setSelectedBudget(budget);
    setFormData(prev => ({
      ...prev,
      budget_id: budget.id
    }));
  };

  const handleBudgetRemoveNew = () => {
    setSelectedBudget(null);
    setFormData(prev => ({
      ...prev,
      budget_id: null
    }));
  };

  // Réinitialiser les états quand la modale se ferme
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
      setNewFile(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setNewFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    setIsLoading(true);
    try {
      console.log('🔍 FileEditModal - Données à sauvegarder:', formData);
      console.log('🔍 FileEditModal - Budget sélectionné:', formData.budget_id);
      console.log('🔍 FileEditModal - Badges sélectionnés:', formData.badge_ids);
      
      // Validation des données avant sauvegarde
      if (formData.budget_id && formData.badge_ids.length === 0) {
        console.log('⚠️ FileEditModal - Budget sélectionné mais aucun badge');
      } else if (formData.badge_ids.length > 0 && !formData.budget_id) {
        console.log('⚠️ FileEditModal - Badges sélectionnés mais aucun budget');
      }

      // Assigner les badges au fichier
      if (formData.badge_ids.length > 0) {
        console.log('🏷️ Assignation des badges au fichier');
        // Répartir équitablement le montant total entre tous les badges sélectionnés
        const amountPerBadge = formData.badge_ids.length > 0 
          ? formData.amount / formData.badge_ids.length 
          : 0;
        
        const badgeAssignments = formData.badge_ids.map(badgeId => ({
          badgeId,
          amountAllocated: amountPerBadge // Répartir équitablement le montant entre les badges
        }));

        await BadgeService.assignBadgesToFile(file.id, badgeAssignments, file.created_by);
        console.log('✅ Badges assignés avec succès');
      } else {
        // Supprimer toutes les assignations de badges si aucun badge n'est sélectionné
        console.log('🗑️ Suppression des assignations de badges existantes');
        await BadgeService.assignBadgesToFile(file.id, [], file.created_by);
        console.log('✅ Assignations de badges supprimées');
      }

      // Mise à jour des métadonnées du fichier
      const fileUpdateData = {
        name: formData.name,
        amount: formData.amount,
        document_date: formData.document_date ? new Date(formData.document_date).toISOString() : file.document_date,
        budget_id: formData.budget_id,
        badge_ids: formData.badge_ids,
        year: formData.document_date ? new Date(formData.document_date).getFullYear().toString() : file.year,
        month: formData.document_date ? (new Date(formData.document_date).getMonth() + 1).toString().padStart(2, '0') : file.month
      };

      console.log('💾 FileEditModal - Données fichier à mettre à jour:', fileUpdateData);
      console.log('💾 FileEditModal - Sauvegarde des badges:', formData.badge_ids.length > 0 ? 'OUI' : 'NON');

      const { error: updateError } = await supabase
        .from('files')
        .update(fileUpdateData)
        .eq('id', file.id);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour du fichier:', updateError);
        throw updateError;
      }
      console.log('✅ Fichier mis à jour avec succès');
      console.log('✅ Badges sauvegardés:', formData.badge_ids.length > 0 ? formData.badge_ids.join(', ') : 'Aucun');

      // Si un nouveau fichier est fourni, le remplacer
      if (newFile) {
        // TODO: Implémenter le remplacement du fichier
        // Cela nécessiterait de supprimer l'ancien fichier du storage et d'uploader le nouveau
        showSuccess('Le remplacement de fichier sera disponible prochainement');
      }

      showSuccess('Fichier mis à jour avec succès');
      console.log('🔄 Rechargement des données...');
      onFileUpdated();
      
      // Notifier les composants budget si des badges ont été modifiés
      if (formData.budget_id || formData.badge_ids.length > 0) {
        console.log('🔄 Notification des composants budget...');
        notifyBudgetChange();
      }
      
      // Callback legacy pour compatibilité
      if (onBudgetExpenseUpdated && (formData.budget_id || formData.badge_ids.length > 0)) {
        onBudgetExpenseUpdated();
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du fichier:', error);
      showError('Erreur lors de la mise à jour du fichier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsLoading(true);
    try {
      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('test')
        .remove([file.path]);

      if (storageError) {
        console.warn('Erreur lors de la suppression du fichier du storage:', storageError);
      }

      // Supprimer l'enregistrement de la base de données
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id);

      if (dbError) {
        throw dbError;
      }

      showSuccess('Fichier supprimé avec succès');
      onFileDeleted();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      showError('Erreur lors de la suppression du fichier');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Modifier la facture
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Informations sur le fichier actuel */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
              <p className="text-sm text-gray-600">
                {formatFileSize(file.size)} • Créé le {new Date(file.createdAt).toLocaleDateString('fr-FR')}
              </p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Voir le fichier →
              </a>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom du fichier */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la facture
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Montant */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Montant
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                id="amount"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', e.target.value ? parseFloat(e.target.value) : null)}
                step="0.01"
                min="0"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                €
              </span>
            </div>
          </div>

          {/* Date du document */}
          <div>
            <label htmlFor="document_date" className="block text-sm font-medium text-gray-700 mb-1">
              Date du document
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                id="document_date"
                value={formData.document_date}
                onChange={(e) => handleInputChange('document_date', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <BudgetBubbleSelector
              budgets={budgets}
              selectedBudget={selectedBudget}
              onBudgetSelect={handleBudgetSelectNew}
              onBudgetRemove={handleBudgetRemoveNew}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Badges */}
          <div>
            <BadgeBubbleSelector
              badges={availableBadges}
              selectedBadges={selectedBadgesForBubbles}
              onBadgeSelect={handleBadgeSelectNew}
              onBadgeRemove={handleBadgeRemoveNew}
              disabled={isLoading}
              className="w-full"
            />
            {formData.budget_id && availableBadges.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Aucun badge disponible pour ce budget. Configurez les badges autorisés dans les paramètres du budget.
              </p>
            )}
          </div>

          {/* Remplacement de fichier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remplacer le fichier (optionnel)
            </label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {newFile && (
              <p className="mt-1 text-sm text-gray-600">
                Nouveau fichier sélectionné: {newFile.name}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Formats acceptés: PDF, JPG, JPEG, PNG, GIF
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                showDeleteConfirm 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer'}
            </button>

            <div className="flex items-center space-x-3">
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
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
