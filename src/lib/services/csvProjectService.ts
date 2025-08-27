import { supabase } from '../supabase';
import type { 
  CsvProject, 
  CsvProjectCreate, 
  CsvProjectUpdate, 
  CsvProjectListItem 
} from '../../types/csvProject';
import type { LettrageState } from '../../types/lettrage';

export class CsvProjectService {
  
  /**
   * Créer un nouveau projet CSV
   */
  static async createProject(
    data: CsvProjectCreate, 
    userId: string, 
    companyId: string
  ): Promise<CsvProject> {
    try {
      console.log('🎯 CsvProjectService - Création projet:', { name: data.name, companyId });
      
      const projectData = {
        name: data.name,
        description: data.description || null,
        project_date: data.project_date,
        csv_file_name: data.csv_file_name,
        csv_data: data.csv_data,
        csv_headers: data.csv_headers,
        column_mapping: data.column_mapping,
        lettrage_state: data.lettrage_state || null,
        created_by: userId,
        company_id: companyId
      };

      const { data: project, error } = await supabase
        .from('csv_projects')
        .insert(projectData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création projet CSV:', error);
        throw new Error(`Erreur lors de la création du projet: ${error.message}`);
      }

      console.log('✅ Projet CSV créé avec succès:', project.id);
      return project;
    } catch (error) {
      console.error('❌ CsvProjectService - createProject:', error);
      throw error;
    }
  }

  /**
   * Obtenir la liste des projets CSV pour une société
   */
  static async getProjectsList(companyId: string): Promise<CsvProjectListItem[]> {
    try {
      console.log('📋 CsvProjectService - Récupération liste projets:', companyId);
      
      const { data, error } = await supabase
        .rpc('get_csv_projects_list', { p_company_id: companyId });

      if (error) {
        console.error('❌ Erreur récupération liste projets:', error);
        throw new Error(`Erreur lors de la récupération des projets: ${error.message}`);
      }

      console.log('✅ Liste projets récupérée:', data?.length || 0, 'projets');
      return data || [];
    } catch (error) {
      console.error('❌ CsvProjectService - getProjectsList:', error);
      throw error;
    }
  }

  /**
   * Obtenir un projet CSV par son ID
   */
  static async getProject(projectId: string): Promise<CsvProject | null> {
    try {
      console.log('🔍 CsvProjectService - Récupération projet:', projectId);
      
      const { data, error } = await supabase
        .from('csv_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ Projet non trouvé:', projectId);
          return null;
        }
        console.error('❌ Erreur récupération projet:', error);
        throw new Error(`Erreur lors de la récupération du projet: ${error.message}`);
      }

      console.log('✅ Projet récupéré:', data.name);
      return data;
    } catch (error) {
      console.error('❌ CsvProjectService - getProject:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un projet CSV
   */
  static async updateProject(
    projectId: string, 
    updates: CsvProjectUpdate
  ): Promise<CsvProject> {
    try {
      console.log('🔄 CsvProjectService - Mise à jour projet:', projectId, updates);
      
      const { data, error } = await supabase
        .from('csv_projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur mise à jour projet:', error);
        throw new Error(`Erreur lors de la mise à jour du projet: ${error.message}`);
      }

      console.log('✅ Projet mis à jour avec succès');
      return data;
    } catch (error) {
      console.error('❌ CsvProjectService - updateProject:', error);
      throw error;
    }
  }

  /**
   * Sauvegarder l'état du lettrage dans un projet
   */
  static async saveLettrageState(
    projectId: string, 
    lettrageState: LettrageState
  ): Promise<void> {
    try {
      console.log('💾 CsvProjectService - Sauvegarde état lettrage:', projectId);
      
      // Convertir l'état en JSON string
      const stateJson = JSON.stringify(lettrageState);
      
      const { error } = await supabase
        .from('csv_projects')
        .update({ 
          lettrage_state: stateJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) {
        console.error('❌ Erreur sauvegarde état lettrage:', error);
        throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
      }

      console.log('✅ État lettrage sauvegardé avec succès');
    } catch (error) {
      console.error('❌ CsvProjectService - saveLettrageState:', error);
      throw error;
    }
  }

  /**
   * Charger l'état du lettrage depuis un projet
   */
  static async loadLettrageState(projectId: string): Promise<LettrageState | null> {
    try {
      console.log('📤 CsvProjectService - Chargement état lettrage:', projectId);
      
      const { data, error } = await supabase
        .from('csv_projects')
        .select('lettrage_state, csv_data, csv_headers, column_mapping')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('❌ Erreur chargement état lettrage:', error);
        throw new Error(`Erreur lors du chargement: ${error.message}`);
      }

      if (!data.lettrage_state) {
        console.log('⚠️ Aucun état lettrage sauvegardé pour ce projet');
        return null;
      }

      // Parser l'état JSON
      const lettrageState = JSON.parse(data.lettrage_state) as LettrageState;
      
      console.log('✅ État lettrage chargé:', {
        csvPayments: lettrageState.csvPayments?.length || 0,
        matches: lettrageState.matches?.length || 0,
        unmatchedInvoices: lettrageState.unmatchedInvoices?.length || 0
      });

      return lettrageState;
    } catch (error) {
      console.error('❌ CsvProjectService - loadLettrageState:', error);
      throw error;
    }
  }

  /**
   * Supprimer un projet CSV
   */
  static async deleteProject(projectId: string): Promise<void> {
    try {
      console.log('🗑️ CsvProjectService - Suppression projet:', projectId);
      
      const { error } = await supabase
        .from('csv_projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('❌ Erreur suppression projet:', error);
        throw new Error(`Erreur lors de la suppression du projet: ${error.message}`);
      }

      console.log('✅ Projet supprimé avec succès');
    } catch (error) {
      console.error('❌ CsvProjectService - deleteProject:', error);
      throw error;
    }
  }

  /**
   * Marquer un projet comme terminé
   */
  static async markAsCompleted(projectId: string): Promise<void> {
    try {
      console.log('✅ CsvProjectService - Marquage projet terminé:', projectId);
      
      await this.updateProject(projectId, { is_completed: true });
      
      console.log('✅ Projet marqué comme terminé');
    } catch (error) {
      console.error('❌ CsvProjectService - markAsCompleted:', error);
      throw error;
    }
  }

  /**
   * Dupliquer un projet CSV
   */
  static async duplicateProject(
    projectId: string,
    newName: string,
    userId: string,
    companyId: string
  ): Promise<CsvProject> {
    try {
      console.log('📋 CsvProjectService - Duplication projet:', projectId, 'vers', newName);
      
      // Récupérer le projet original
      const original = await this.getProject(projectId);
      if (!original) {
        throw new Error('Projet original non trouvé');
      }

      // Créer le nouveau projet
      const duplicateData: CsvProjectCreate = {
        name: newName,
        description: `Copie de "${original.name}"`,
        project_date: original.project_date,
        csv_file_name: original.csv_file_name,
        csv_data: original.csv_data,
        csv_headers: original.csv_headers,
        column_mapping: original.column_mapping,
        lettrage_state: original.lettrage_state || undefined
      };

      const newProject = await this.createProject(duplicateData, userId, companyId);
      
      console.log('✅ Projet dupliqué avec succès:', newProject.id);
      return newProject;
    } catch (error) {
      console.error('❌ CsvProjectService - duplicateProject:', error);
      throw error;
    }
  }

  /**
   * Rechercher des projets par nom ou description
   */
  static async searchProjects(
    companyId: string, 
    searchTerm: string
  ): Promise<CsvProjectListItem[]> {
    try {
      console.log('🔍 CsvProjectService - Recherche projets:', searchTerm);
      
      const { data, error } = await supabase
        .from('csv_projects')
        .select(`
          id, name, description, project_date, csv_file_name, 
          is_completed, created_at, updated_at
        `)
        .eq('company_id', companyId)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur recherche projets:', error);
        throw new Error(`Erreur lors de la recherche: ${error.message}`);
      }

      console.log('✅ Recherche terminée:', data?.length || 0, 'résultats');
      
      // Ajouter des statistiques par défaut pour la recherche
      return (data || []).map(project => ({
        ...project,
        total_payments: 0,
        matched_count: 0,
        unmatched_count: 0
      }));
    } catch (error) {
      console.error('❌ CsvProjectService - searchProjects:', error);
      throw error;
    }
  }
}
