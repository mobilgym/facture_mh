import React, { useState, useEffect } from 'react';
import { X, Save, Palette } from 'lucide-react';
import { Badge } from './Badge';
import type { Badge as BadgeType, CreateBadgeForm } from '../../types/badge';
import { BADGE_COLORS } from '../../types/badge';

interface BadgeFormProps {
  badge?: BadgeType;
  onSubmit: (data: CreateBadgeForm) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function BadgeForm({ badge, onSubmit, onClose, isLoading = false }: BadgeFormProps) {
  const [formData, setFormData] = useState<CreateBadgeForm>({
    name: '',
    description: '',
    color: BADGE_COLORS[0],
    icon: ''
  });

  const [errors, setErrors] = useState<Partial<CreateBadgeForm>>({});
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Pré-remplir le formulaire si on édite un badge
  useEffect(() => {
    if (badge) {
      setFormData({
        name: badge.name,
        description: badge.description || '',
        color: badge.color,
        icon: badge.icon || ''
      });
    }
  }, [badge]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateBadgeForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    if (!formData.color) {
      newErrors.color = 'La couleur est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof CreateBadgeForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Badge preview
  const previewBadge: BadgeType = {
    id: 'preview',
    company_id: '',
    name: formData.name || 'Aperçu',
    description: formData.description,
    color: formData.color,
    icon: formData.icon,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: ''
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {badge ? 'Modifier le badge' : 'Nouveau badge'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Aperçu */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Aperçu :</span>
            <Badge badge={previewBadge} variant="default" />
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du badge <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ex: Marketing, Développement, Urgence..."
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnelle)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Description du badge..."
              maxLength={200}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/200 caractères
            </p>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              >
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="text-sm text-gray-700">
                  {formData.color}
                </span>
                <Palette className="w-4 h-4 text-gray-400" />
              </button>

              {/* Palette de couleurs */}
              {showColorPicker && (
                <div className="absolute z-10 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="grid grid-cols-5 gap-2">
                    {BADGE_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          handleInputChange('color', color);
                          setShowColorPicker(false);
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color 
                            ? 'border-gray-900 scale-110' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.color && (
              <p className="mt-1 text-sm text-red-600">{errors.color}</p>
            )}
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
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {badge ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Overlay pour fermer la palette */}
        {showColorPicker && (
          <div 
            className="fixed inset-0 z-5"
            onClick={() => setShowColorPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
