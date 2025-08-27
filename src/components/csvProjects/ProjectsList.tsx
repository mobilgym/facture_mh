import React, { useState } from 'react';
import { 
  FolderOpen, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock, 
  Search, 
  Plus,
  Edit3,
  Trash2,
  Copy,
  Play,
  MoreVertical
} from 'lucide-react';
import Button from '../ui/Button';
import type { CsvProjectListItem } from '../../types/csvProject';

interface ProjectsListProps {
  projects: CsvProjectListItem[];
  loading: boolean;
  onLoadProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string, newName: string) => void;
  onSearch: (searchTerm: string) => void;
  onCreateNew: () => void;
}

export function ProjectsList({
  projects,
  loading,
  onLoadProject,
  onDeleteProject,
  onDuplicateProject,
  onSearch,
  onCreateNew
}: ProjectsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleDuplicate = (project: CsvProjectListItem) => {
    const newName = `${project.name} (Copie)`;
    onDuplicateProject(project.id, newName);
    setActiveDropdown(null);
  };

  const handleDelete = (projectId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      onDeleteProject(projectId);
    }
    setActiveDropdown(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (project: CsvProjectListItem) => {
    if (project.total_payments === 0) return 0;
    return Math.round((project.matched_count / project.total_payments) * 100);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Projets CSV de Lettrage
              </h3>
              <p className="text-sm text-gray-500">
                Gérez et reprenez vos projets de lettrage
              </p>
            </div>
          </div>
          
          <Button
            onClick={onCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Projet
          </Button>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou description..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des projets */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              Chargement des projets...
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Aucun projet trouvé
            </h4>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Aucun projet ne correspond à votre recherche.' : 'Créez votre premier projet de lettrage.'}
            </p>
          </div>
        ) : (
          projects.map((project) => {
            const progress = getProgressPercentage(project);
            
            return (
              <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  
                  {/* Informations principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-medium text-gray-900 truncate">
                        {project.name}
                      </h4>
                      
                      {/* Badge statut */}
                      {project.is_completed ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Terminé
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          En cours
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(project.project_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {project.csv_file_name}
                      </div>
                      <div>
                        Créé le {formatDate(project.created_at)}
                      </div>
                    </div>

                    {/* Statistiques et progrès */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          <span className="font-medium text-gray-900">{project.total_payments}</span> paiements
                        </span>
                        <span className="text-green-600">
                          <span className="font-medium">{project.matched_count}</span> lettrés
                        </span>
                        <span className="text-orange-600">
                          <span className="font-medium">{project.unmatched_count}</span> en attente
                        </span>
                      </div>
                      
                      {/* Barre de progression */}
                      {project.total_payments > 0 && (
                        <div className="flex-1 max-w-xs">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progrès</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => onLoadProject(project.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Ouvrir
                    </Button>

                    {/* Menu dropdown */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveDropdown(activeDropdown === project.id ? null : project.id)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>

                      {activeDropdown === project.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button
                            onClick={() => handleDuplicate(project)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Dupliquer
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer avec statistiques */}
      {projects.length > 0 && !loading && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{projects.length} projet{projects.length > 1 ? 's' : ''}</span>
            <span>
              {projects.filter(p => p.is_completed).length} terminé{projects.filter(p => p.is_completed).length > 1 ? 's' : ''} • {' '}
              {projects.filter(p => !p.is_completed).length} en cours
            </span>
          </div>
        </div>
      )}

      {/* Fermer le dropdown en cliquant à l'extérieur */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
}
