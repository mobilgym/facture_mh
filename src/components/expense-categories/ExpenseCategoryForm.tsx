import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Palette, FileText } from 'lucide-react';
import type { CreateExpenseCategoryForm, ExpenseCategoryWithStats } from '../../types/budget';
import { ExpenseCategoryService } from '../../lib/services/expenseCategoryService';

interface ExpenseCategoryFormProps {
  category?: ExpenseCategoryWithStats | null;
  onSubmit: (data: CreateExpenseCategoryForm) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function ExpenseCategoryForm({ 
  category, 
  onSubmit, 
  onClose, 
  isLoading = false 
}: ExpenseCategoryFormProps) {
  const [formData, setFormData] = useState<CreateExpenseCategoryForm>({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const [errors, setErrors] = useState<Partial<CreateExpenseCategoryForm>>({});
  const [showColorPicker, setShowColorPicker] = useState(false);

  const defaultColors = ExpenseCategoryService.getDefaultColors();

  // Pré-remplir le formulaire si on édite une catégorie
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color
      });
    } else {
      // Pour une nouvelle catégorie, utiliser une couleur aléatoire
      setFormData(prev => ({
        ...prev,
        color: ExpenseCategoryService.getRandomColor()
      }));
    }
  }, [category]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateExpenseCategoryForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.color) {
      newErrors.color = 'Veuillez sélectionner une couleur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || ''
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const handleInputChange = (field: keyof CreateExpenseCategoryForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleColorSelect = (color: string) => {
    handleInputChange('color', color);
    setShowColorPicker(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {category ? 'Modifier le poste de dépense' : 'Créer un nouveau poste de dépense'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du poste *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Loyer, Matériel, Communication..."
                required
                maxLength={100}
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
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description du poste de dépense (optionnel)"
                maxLength={255}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/255 caractères
            </p>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur *
            </label>
            <div className="space-y-3">
              {/* Couleur sélectionnée */}
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg border-2 border-gray-300 cursor-pointer"
                  style={{ backgroundColor: formData.color }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#3B82F6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Palette className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Palette de couleurs */}
              {showColorPicker && (
                <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform ${
                        formData.color === color 
                          ? 'border-gray-800 ring-2 ring-blue-500' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
            {errors.color && (
              <p className="mt-1 text-sm text-red-600">{errors.color}</p>
            )}
          </div>

          {/* Aperçu */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu</h4>
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: formData.color }}
              />
              <div>
                <p className="font-medium text-gray-900">
                  {formData.name || 'Nom du poste'}
                </p>
                {formData.description && (
                  <p className="text-sm text-gray-600">
                    {formData.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
                  {category ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {category ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
