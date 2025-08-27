import { useState, useCallback, useEffect } from 'react';
import { CsvProjectService } from '../lib/services/csvProjectService';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import type { 
  CsvProject, 
  CsvProjectCreate, 
  CsvProjectUpdate, 
  CsvProjectListItem 
} from '../types/csvProject';
import type { LettrageState } from '../types/lettrage';

interface UseCsvProjectsReturn {
  // État
  projects: CsvProjectListItem[];
  currentProject: CsvProject | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadProjects: () => Promise<void>;
  createProject: (data: CsvProjectCreate) => Promise<CsvProject>;
  loadProject: (projectId: string) => Promise<CsvProject | null>;
  updateProject: (projectId: string, updates: CsvProjectUpdate) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  saveLettrageState: (projectId: string, state: LettrageState) => Promise<void>;
  loadLettrageState: (projectId: string) => Promise<LettrageState | null>;
  markAsCompleted: (projectId: string) => Promise<void>;
  duplicateProject: (projectId: string, newName: string) => Promise<CsvProject>;
  searchProjects: (searchTerm: string) => Promise<void>;
  clearCurrentProject: () => void;
  clearError: () => void;
}

export function useCsvProjects(): UseCsvProjectsReturn {
  const [projects, setProjects] = useState<CsvProjectListItem[]>([]);
  const [currentProject, setCurrentProject] = useState<CsvProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { selectedCompany } = useCompany();
  const { user } = useAuth();

  /**
   * Charger la liste des projets
   */
  const loadProjects = useCallback(async () => {
    if (!selectedCompany?.id) {
      console.warn('⚠️ Aucune société sélectionnée');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Chargement des projets CSV...');
      const projectsList = await CsvProjectService.getProjectsList(selectedCompany.id);
      
      setProjects(projectsList);
      console.log('✅ Projets chargés:', projectsList.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des projets';
      console.error('❌ Erreur chargement projets:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id]);

  /**
   * Créer un nouveau projet
   */
  const createProject = useCallback(async (data: CsvProjectCreate): Promise<CsvProject> => {
    if (!selectedCompany?.id || !user?.id) {
      throw new Error('Utilisateur ou société non disponible');
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 Création nouveau projet CSV:', data.name);
      const newProject = await CsvProjectService.createProject(data, user.id, selectedCompany.id);
      
      // Recharger la liste des projets
      await loadProjects();
      
      console.log('✅ Projet créé avec succès:', newProject.id);
      return newProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du projet';
      console.error('❌ Erreur création projet:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, user?.id, loadProjects]);

  /**
   * Charger un projet spécifique
   */
  const loadProject = useCallback(async (projectId: string): Promise<CsvProject | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Chargement projet:', projectId);
      const project = await CsvProjectService.getProject(projectId);
      
      setCurrentProject(project);
      console.log('✅ Projet chargé:', project?.name || 'Non trouvé');
      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du projet';
      console.error('❌ Erreur chargement projet:', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mettre à jour un projet
   */
  const updateProject = useCallback(async (projectId: string, updates: CsvProjectUpdate) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Mise à jour projet:', projectId);
      const updatedProject = await CsvProjectService.updateProject(projectId, updates);
      
      // Mettre à jour le projet courant si c'est le même
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject);
      }
      
      // Recharger la liste des projets
      await loadProjects();
      
      console.log('✅ Projet mis à jour avec succès');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du projet';
      console.error('❌ Erreur mise à jour projet:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, loadProjects]);

  /**
   * Supprimer un projet
   */
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🗑️ Suppression projet:', projectId);
      await CsvProjectService.deleteProject(projectId);
      
      // Nettoyer le projet courant si c'est celui supprimé
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
      
      // Recharger la liste des projets
      await loadProjects();
      
      console.log('✅ Projet supprimé avec succès');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du projet';
      console.error('❌ Erreur suppression projet:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, loadProjects]);

  /**
   * Sauvegarder l'état du lettrage
   */
  const saveLettrageState = useCallback(async (projectId: string, state: LettrageState) => {
    try {
      console.log('💾 Sauvegarde état lettrage pour projet:', projectId);
      await CsvProjectService.saveLettrageState(projectId, state);
      
      // Recharger la liste pour mettre à jour les statistiques
      await loadProjects();
      
      console.log('✅ État lettrage sauvegardé');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      console.error('❌ Erreur sauvegarde état:', err);
      setError(errorMessage);
      throw err;
    }
  }, [loadProjects]);

  /**
   * Charger l'état du lettrage
   */
  const loadLettrageState = useCallback(async (projectId: string): Promise<LettrageState | null> => {
    try {
      console.log('📤 Chargement état lettrage pour projet:', projectId);
      const state = await CsvProjectService.loadLettrageState(projectId);
      
      console.log('✅ État lettrage chargé');
      return state;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'état';
      console.error('❌ Erreur chargement état:', err);
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Marquer un projet comme terminé
   */
  const markAsCompleted = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('✅ Marquage projet terminé:', projectId);
      await CsvProjectService.markAsCompleted(projectId);
      
      // Recharger la liste et le projet courant
      await loadProjects();
      if (currentProject?.id === projectId) {
        await loadProject(projectId);
      }
      
      console.log('✅ Projet marqué comme terminé');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du marquage';
      console.error('❌ Erreur marquage terminé:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProjects, currentProject?.id, loadProject]);

  /**
   * Dupliquer un projet
   */
  const duplicateProject = useCallback(async (projectId: string, newName: string): Promise<CsvProject> => {
    if (!selectedCompany?.id || !user?.id) {
      throw new Error('Utilisateur ou société non disponible');
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Duplication projet:', projectId, 'vers', newName);
      const duplicatedProject = await CsvProjectService.duplicateProject(
        projectId, 
        newName, 
        user.id, 
        selectedCompany.id
      );
      
      // Recharger la liste des projets
      await loadProjects();
      
      console.log('✅ Projet dupliqué avec succès');
      return duplicatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la duplication';
      console.error('❌ Erreur duplication projet:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, user?.id, loadProjects]);

  /**
   * Rechercher des projets
   */
  const searchProjects = useCallback(async (searchTerm: string) => {
    if (!selectedCompany?.id) {
      console.warn('⚠️ Aucune société sélectionnée');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Recherche projets:', searchTerm);
      
      if (searchTerm.trim() === '') {
        // Si pas de terme de recherche, charger tous les projets
        await loadProjects();
      } else {
        const searchResults = await CsvProjectService.searchProjects(selectedCompany.id, searchTerm);
        setProjects(searchResults);
      }
      
      console.log('✅ Recherche terminée');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la recherche';
      console.error('❌ Erreur recherche projets:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, loadProjects]);

  /**
   * Nettoyer le projet courant
   */
  const clearCurrentProject = useCallback(() => {
    setCurrentProject(null);
  }, []);

  /**
   * Nettoyer l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Charger les projets au montage du composant
  useEffect(() => {
    if (selectedCompany?.id) {
      loadProjects();
    }
  }, [selectedCompany?.id, loadProjects]);

  return {
    // État
    projects,
    currentProject,
    loading,
    error,
    
    // Actions
    loadProjects,
    createProject,
    loadProject,
    updateProject,
    deleteProject,
    saveLettrageState,
    loadLettrageState,
    markAsCompleted,
    duplicateProject,
    searchProjects,
    clearCurrentProject,
    clearError
  };
}
