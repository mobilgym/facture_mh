import React, { useState } from 'react';
import { 
  FolderOpen, 
  Save, 
  FileText, 
  Calendar,
  Clock,
  CheckCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectsList } from './ProjectsList';
import { useCsvProjects } from '../../hooks/useCsvProjects';
import type { CsvProjectCreate } from '../../types/csvProject';
import type { LettrageState } from '../../types/lettrage';

interface ProjectManagerProps {
  currentCsvData?: {
    fileName: string;
    data: string;
    headers: string[];
    columnMapping: {
      dateColumn: number;
      amountColumn: number;
      descriptionColumn: number | null;
    };
  };
  currentLettrageState?: LettrageState;
  onLoadProject: (projectData: {
    csvData: string;
    headers: string[];
    columnMapping: any;
    lettrageState?: LettrageState;
  }) => void;
  onProjectSaved?: () => void;
}

export function ProjectManager({
  currentCsvData,
  currentLettrageState,
  onLoadProject,
  onProjectSaved
}: ProjectManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjectsList, setShowProjectsList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const csvProjects = useCsvProjects();

  /**
   * Sauvegarder le projet actuel
   */
  const handleSaveProject = async (data: CsvProjectCreate) => {
    try {
      setIsSaving(true);
      await csvProjects.createProject(data);
      setShowCreateModal(false);
      onProjectSaved?.();
    } catch (error) {
      console.error('Erreur sauvegarde projet:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Charger un projet existant
   */
  const handleLoadProject = async (projectId: string) => {
    try {
      const project = await csvProjects.loadProject(projectId);
      if (!project) {
        console.error('Projet non trouvé');
        return;
      }

      // Charger l'état du lettrage s'il existe
      const lettrageState = await csvProjects.loadLettrageState(projectId);

      // Parser les données CSV
      const csvData = project.csv_data;
      const headers = project.csv_headers;
      const columnMapping = project.column_mapping;

      // Notifier le parent avec les données
      onLoadProject({
        csvData,
        headers,
        columnMapping,
        lettrageState: lettrageState || undefined
      });

      setShowProjectsList(false);
    } catch (error) {
      console.error('Erreur chargement projet:', error);
    }
  };

  /**
   * Sauvegarder l'état actuel du lettrage
   */
  const handleQuickSave = async () => {
    if (!csvProjects.currentProject || !currentLettrageState) {
      console.warn('Aucun projet courant ou état de lettrage');
      return;
    }

    try {
      setIsSaving(true);
      await csvProjects.saveLettrageState(csvProjects.currentProject.id, currentLettrageState);
    } catch (error) {
      console.error('Erreur sauvegarde rapide:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedWork = currentCsvData && (currentLettrageState?.csvPayments?.length || 0) > 0;

  return (
    <div className="space-y-4">
      
      {/* Barre d'actions principales */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700">
          <FolderOpen className="w-5 h-5" />
          <span className="font-medium">Gestion des Projets CSV</span>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {/* Sauvegarde rapide */}
          {csvProjects.currentProject && hasUnsavedWork && (
            <Button
              onClick={handleQuickSave}
              disabled={isSaving}
              variant="ghost"
              size="sm"
              className="text-blue-700 hover:bg-blue-100"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Sauvegarde rapide
            </Button>
          )}

          {/* Nouveau projet / Sauvegarder */}
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={!currentCsvData}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Save className="w-4 h-4 mr-1" />
            {csvProjects.currentProject ? 'Sauvegarder sous...' : 'Enregistrer Projet'}
          </Button>

          {/* Liste des projets */}
          <Button
            onClick={() => setShowProjectsList(true)}
            variant="outline"
            size="sm"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            Mes Projets
          </Button>
        </div>
      </div>

      {/* Informations projet actuel */}
      {csvProjects.currentProject && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-900">
                  {csvProjects.currentProject.name}
                </h4>
                <div className="flex items-center gap-4 text-sm text-green-700 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(csvProjects.currentProject.project_date).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex items-center gap-1">
                    {csvProjects.currentProject.is_completed ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Terminé
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        En cours
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {hasUnsavedWork && (
              <div className="flex items-center gap-1 text-orange-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Modifications non sauvegardées
              </div>
            )}
          </div>
          
          {csvProjects.currentProject.description && (
            <p className="text-sm text-green-700 mt-3">
              {csvProjects.currentProject.description}
            </p>
          )}
        </div>
      )}

      {/* Message d'aide */}
      {!currentCsvData && (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Importez un fichier CSV pour commencer un nouveau projet de lettrage
          </p>
        </div>
      )}

      {/* Modal création de projet */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleSaveProject}
        csvData={currentCsvData}
        lettrageState={currentLettrageState ? JSON.stringify(currentLettrageState) : undefined}
      />

      {/* Modal liste des projets */}
      {showProjectsList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Mes Projets CSV</h3>
              <Button
                onClick={() => setShowProjectsList(false)}
                variant="ghost"
                size="sm"
              >
                Fermer
              </Button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <ProjectsList
                projects={csvProjects.projects}
                loading={csvProjects.loading}
                onLoadProject={handleLoadProject}
                onDeleteProject={csvProjects.deleteProject}
                onDuplicateProject={csvProjects.duplicateProject}
                onSearch={csvProjects.searchProjects}
                onCreateNew={() => {
                  setShowProjectsList(false);
                  setShowCreateModal(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Affichage des erreurs */}
      {csvProjects.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Erreur</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{csvProjects.error}</p>
          <Button
            onClick={csvProjects.clearError}
            variant="ghost"
            size="sm"
            className="mt-2 text-red-600 hover:bg-red-100"
          >
            Fermer
          </Button>
        </div>
      )}
    </div>
  );
}
