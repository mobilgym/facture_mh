import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2, DollarSign, Tag, Calendar, Building } from 'lucide-react';
import type { FileItem } from '../../types/file';
import { useBudgets } from '../../hooks/useBudgets';
import { useExpenseCategories } from '../../hooks/useExpenseCategories';
import { useBudgetExpenseCategories } from '../../hooks/useBudgetExpenseCategories';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface FileEditModalProps {
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
  onFileUpdated: () => void;
  onFileDeleted: () => void;
}

interface FileUpdateData {
  name: string;
  amount: number | null;
  document_date: string;
  budget_id: string | null;
  expense_category_id: string | null;
}

export function FileEditModal({ file, isOpen, onClose, onFileUpdated, onFileDeleted }: FileEditModalProps) {
  const [formData, setFormData] = useState<FileUpdateData>({
    name: '',
    amount: null,
    document_date: '',
    budget_id: null,
    expense_category_id: null
  });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { budgets } = useBudgets();
  const { activeCategories } = useExpenseCategories();
  const { categories: budgetCategories } = useBudgetExpenseCategories(formData.budget_id);
  const [availableCategories, setAvailableCategories] = useState<ExpenseCategory[]>([]);
  const { selectedCompany } = useCompany();
  const { success: showSuccess, error: showError } = useToast();

  // Mettre à jour les catégories disponibles en fonction du budget sélectionné
  useEffect(() => {
    // Réinitialiser la catégorie si on change de budget ou si on retire le budget
    setFormData(prev => ({
      ...prev,
      expense_category_id: null
    }));

    // Si un budget est sélectionné, afficher ses postes de dépenses
    if (formData.budget_id) {
      setAvailableCategories(budgetCategories);
    } else {
      // Si aucun budget n'est sélectionné, aucun poste de dépense n'est disponible
      setAvailableCategories([]);
    }
  }, [formData.budget_id, budgetCategories]);

  // Initialiser le formulaire avec les données du fichier
  useEffect(() => {
    if (file) {
      console.log('🔄 FileEditModal - Initialisation avec le fichier:', file);
      console.log('🔄 FileEditModal - Budget ID du fichier:', file.budget_id);
      console.log('🔄 FileEditModal - Expense Category ID du fichier:', file.expense_category_id);
      
      setFormData({
        name: file.name,
        amount: file.amount || null,
        document_date: file.document_date ? file.document_date.split('T')[0] : '',
        budget_id: file.budget_id || null,
        expense_category_id: file.expense_category_id || null
      });
    }
  }, [file]);

  const handleInputChange = (field: keyof FileUpdateData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
      console.log('🔍 FileEditModal - Catégorie sélectionnée:', formData.expense_category_id);

      // Vérifier s'il existe déjà une dépense pour ce fichier
      const { data: existingExpense, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('file_id', file.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Erreur lors de la vérification de dépense existante:', checkError);
      }

      // Créer ou mettre à jour une dépense si un budget est sélectionné
      if (formData.budget_id && formData.amount) {
        const expenseData = {
          company_id: selectedCompany.id,
          budget_id: formData.budget_id,
          expense_category_id: formData.expense_category_id,
          file_id: file.id,
          title: formData.name,
          amount: formData.amount,
          expense_date: formData.document_date ? new Date(formData.document_date).toISOString() : new Date().toISOString(),
          status: 'approved' as const,
          created_by: file.created_by
        };

        console.log('💾 FileEditModal - Données dépense à insérer/mettre à jour:', expenseData);

        if (existingExpense) {
          // Mettre à jour la dépense existante
          console.log('🔄 Mise à jour de la dépense existante:', existingExpense.id);
          const { error: expenseError } = await supabase
            .from('expenses')
            .update(expenseData)
            .eq('id', existingExpense.id);

          if (expenseError) {
            console.error('❌ Erreur lors de la mise à jour de la dépense:', expenseError);
            throw expenseError;
          }
          console.log('✅ Dépense mise à jour avec succès');
        } else {
          // Créer une nouvelle dépense
          console.log('➕ Création d\'une nouvelle dépense');
          const { error: expenseError } = await supabase
            .from('expenses')
            .insert(expenseData);

          if (expenseError) {
            console.error('❌ Erreur lors de la création de la dépense:', expenseError);
            throw expenseError;
          }
          console.log('✅ Dépense créée avec succès');
        }
      } else if (existingExpense) {
        // Si aucun budget n'est sélectionné mais qu'une dépense existe, la supprimer
        console.log('🗑️ Suppression de la dépense existante car aucun budget sélectionné');
        const { error: deleteError } = await supabase
          .from('expenses')
          .delete()
          .eq('id', existingExpense.id);

        if (deleteError) {
          console.error('❌ Erreur lors de la suppression de la dépense:', deleteError);
          throw deleteError;
        }
        console.log('✅ Dépense supprimée avec succès');
      }

      // Mise à jour des métadonnées du fichier
      const fileUpdateData = {
        name: formData.name,
        amount: formData.amount,
        document_date: formData.document_date ? new Date(formData.document_date).toISOString() : file.document_date,
        budget_id: formData.budget_id,
        expense_category_id: formData.expense_category_id,
        year: formData.document_date ? new Date(formData.document_date).getFullYear().toString() : file.year,
        month: formData.document_date ? (new Date(formData.document_date).getMonth() + 1).toString().padStart(2, '0') : file.month
      };

      console.log('💾 FileEditModal - Données fichier à mettre à jour:', fileUpdateData);

      const { error: updateError } = await supabase
        .from('files')
        .update(fileUpdateData)
        .eq('id', file.id);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour du fichier:', updateError);
        throw updateError;
      }
      console.log('✅ Fichier mis à jour avec succès');

      // Si un nouveau fichier est fourni, le remplacer
      if (newFile) {
        // TODO: Implémenter le remplacement du fichier
        // Cela nécessiterait de supprimer l'ancien fichier du storage et d'uploader le nouveau
        showSuccess('Le remplacement de fichier sera disponible prochainement');
      }

      showSuccess('Fichier mis à jour avec succès');
      console.log('🔄 Rechargement des données...');
      onFileUpdated();
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
            <label htmlFor="budget_id" className="block text-sm font-medium text-gray-700 mb-1">
              Budget
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="budget_id"
                value={formData.budget_id || ''}
                onChange={(e) => handleInputChange('budget_id', e.target.value || null)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Aucun budget</option>
                {budgets.map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name} ({new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(budget.remaining_amount)} restant)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Poste de dépense */}
          <div>
            <label htmlFor="expense_category_id" className="block text-sm font-medium text-gray-700 mb-1">
              Poste de dépense
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="expense_category_id"
                value={formData.expense_category_id || ''}
                onChange={(e) => handleInputChange('expense_category_id', e.target.value || null)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Aucun poste</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    <span style={{ color: category.color }}>●</span> {category.name}
                  </option>
                ))}
              </select>
            </div>
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
