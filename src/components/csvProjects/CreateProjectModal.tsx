import React, { useState } from 'react';
import { X, FolderPlus, Calendar, FileText, Save } from 'lucide-react';
import Button from '../ui/Button';
import type { CsvProjectCreate } from '../../types/csvProject';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CsvProjectCreate) => Promise<void>;
  csvData?: {
    fileName: string;
    data: string;
    headers: string[];
    columnMapping: {
      dateColumn: number;
      amountColumn: number;
      descriptionColumn: number | null;
    };
  };
  lettrageState?: string;
}

export function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  csvData,
  lettrageState 
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_date: new Date().toISOString().split('T')[0] // Date d'aujourd'hui par défaut
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !csvData) {
      return;
    }

    try {
      setIsLoading(true);
      
      const projectData: CsvProjectCreate = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        project_date: formData.project_date,
        csv_file_name: csvData.fileName,
        csv_data: csvData.data,
        csv_headers: csvData.headers,
        column_mapping: csvData.columnMapping,
        lettrage_state: lettrageState
      };

      await onConfirm(projectData);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        project_date: new Date().toISOString().split('T')[0]
      });
      
      onClose();
    } catch (error) {
      console.error('Erreur création projet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Enregistrer le Projet CSV
              </h3>
              <p className="text-sm text-gray-500">
                Sauvegardez votre travail pour le reprendre plus tard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Nom du projet */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du projet *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Lettrage Décembre 2024"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du projet de lettrage..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Date du projet */}
          <div>
            <label htmlFor="project_date" className="block text-sm font-medium text-gray-700 mb-2">
              Date du projet *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                id="project_date"
                value={formData.project_date}
                onChange={(e) => handleChange('project_date', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Date à laquelle ce lettrage se rapporte
            </p>
          </div>

          {/* Informations CSV */}
          {csvData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Fichier CSV</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-medium">Fichier:</span> {csvData.fileName}</p>
                <p><span className="font-medium">Lignes:</span> {csvData.data.split('\n').length - 1}</p>
                <p><span className="font-medium">Colonnes:</span> Date: {csvData.headers[csvData.columnMapping.dateColumn]}, Montant: {csvData.headers[csvData.columnMapping.amountColumn]}</p>
              </div>
            </div>
          )}

          {/* État du lettrage */}
          {lettrageState && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-700 mb-1">État du lettrage inclus</h4>
              <p className="text-xs text-green-600">
                Le progrès actuel du lettrage sera sauvegardé avec le projet
              </p>
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sauvegarde...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Enregistrer le Projet
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
