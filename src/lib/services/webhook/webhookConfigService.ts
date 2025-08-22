import { supabase } from '@/lib/supabase';

export interface WebhookConfigurationDB {
  id: string;
  company_id: string;
  webhook_url: string;
  http_method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  is_enabled: boolean;
  description?: string;
  last_tested_at?: string;
  last_test_success?: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface WebhookConfiguration {
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  enabled: boolean;
  description?: string;
  lastTestedAt?: Date;
  lastTestSuccess?: boolean;
}

export class WebhookConfigService {
  
  /**
   * Récupérer la configuration webhook active globale
   */
  static async getActiveConfiguration(): Promise<WebhookConfiguration | null> {
    try {
      console.log('🔗 [WebhookConfig] Récupération de la configuration webhook globale');
      
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .eq('is_enabled', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Aucune configuration trouvée
          console.log('🔗 [WebhookConfig] Aucune configuration active trouvée');
          return null;
        }
        throw error;
      }

      console.log('🔗 [WebhookConfig] Configuration trouvée:', data);
      
      return {
        url: data.webhook_url,
        method: data.http_method,
        headers: data.headers as Record<string, string> || {},
        enabled: data.is_enabled,
        description: data.description || undefined,
        lastTestedAt: data.last_tested_at ? new Date(data.last_tested_at) : undefined,
        lastTestSuccess: data.last_test_success || undefined
      };

    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors de la récupération:', error);
      throw new Error('Impossible de récupérer la configuration webhook');
    }
  }

  /**
   * Récupérer toutes les configurations webhook globales
   */
  static async getAllConfigurations(): Promise<WebhookConfigurationDB[]> {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors de la récupération des configurations:', error);
      throw new Error('Impossible de récupérer les configurations webhook');
    }
  }

  /**
   * Sauvegarder une nouvelle configuration webhook
   */
  static async saveConfiguration(
    config: WebhookConfiguration,
    userId: string
  ): Promise<WebhookConfigurationDB> {
    try {
      console.log('🔗 [WebhookConfig] Sauvegarde de la configuration:', config);

      // Si cette configuration est activée, désactiver les autres
      if (config.enabled) {
        await this.disableAllConfigurations(userId);
      }

      const { data, error } = await supabase
        .from('webhook_configurations')
        .insert({
          company_id: null, // Configuration globale
          webhook_url: config.url,
          http_method: config.method,
          headers: config.headers || { 'Content-Type': 'application/json' },
          is_enabled: config.enabled,
          description: config.description,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [WebhookConfig] Configuration sauvegardée:', data);
      return data;

    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors de la sauvegarde:', error);
      throw new Error('Impossible de sauvegarder la configuration webhook');
    }
  }

  /**
   * Mettre à jour une configuration webhook existante
   */
  static async updateConfiguration(
    configId: string,
    config: Partial<WebhookConfiguration>,
    userId: string
  ): Promise<WebhookConfigurationDB> {
    try {
      console.log('🔗 [WebhookConfig] Mise à jour de la configuration:', configId, config);

      // Si cette configuration est activée, désactiver les autres
      if (config.enabled) {
        await this.disableAllConfigurations(userId, configId);
      }

      const updateData: any = {
        updated_by: userId
      };

      if (config.url !== undefined) updateData.webhook_url = config.url;
      if (config.method !== undefined) updateData.http_method = config.method;
      if (config.headers !== undefined) updateData.headers = config.headers;
      if (config.enabled !== undefined) updateData.is_enabled = config.enabled;
      if (config.description !== undefined) updateData.description = config.description;

      const { data, error } = await supabase
        .from('webhook_configurations')
        .update(updateData)
        .eq('id', configId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [WebhookConfig] Configuration mise à jour:', data);
      return data;

    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors de la mise à jour:', error);
      throw new Error('Impossible de mettre à jour la configuration webhook');
    }
  }

  /**
   * Supprimer une configuration webhook
   */
  static async deleteConfiguration(configId: string): Promise<void> {
    try {
      console.log('🔗 [WebhookConfig] Suppression de la configuration:', configId);

      const { error } = await supabase
        .from('webhook_configurations')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      console.log('✅ [WebhookConfig] Configuration supprimée');

    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors de la suppression:', error);
      throw new Error('Impossible de supprimer la configuration webhook');
    }
  }

  /**
   * Enregistrer le résultat d'un test de connexion
   */
  static async recordTestResult(
    configId: string,
    success: boolean,
    userId: string
  ): Promise<void> {
    try {
      console.log('🔗 [WebhookConfig] Enregistrement du test:', configId, success);

      const { error } = await supabase
        .from('webhook_configurations')
        .update({
          last_tested_at: new Date().toISOString(),
          last_test_success: success,
          updated_by: userId
        })
        .eq('id', configId);

      if (error) throw error;

      console.log('✅ [WebhookConfig] Résultat du test enregistré');

    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors de l\'enregistrement du test:', error);
      // Ne pas lancer d'erreur pour ne pas bloquer le test
    }
  }

  /**
   * Désactiver toutes les configurations globales (sauf une optionnelle)
   */
  private static async disableAllConfigurations(
    userId: string, 
    exceptConfigId?: string
  ): Promise<void> {
    try {
      let query = supabase
        .from('webhook_configurations')
        .update({ 
          is_enabled: false,
          updated_by: userId
        })
        .eq('is_enabled', true);

      if (exceptConfigId) {
        query = query.neq('id', exceptConfigId);
      }

      const { error } = await query;

      if (error) throw error;

      console.log('🔗 [WebhookConfig] Autres configurations désactivées');

    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors de la désactivation:', error);
      throw error;
    }
  }

  /**
   * Créer ou mettre à jour la configuration globale unique
   */
  static async upsertConfiguration(
    config: WebhookConfiguration,
    userId: string
  ): Promise<WebhookConfigurationDB> {
    try {
      // Chercher une configuration existante
      const existingConfigs = await this.getAllConfigurations();
      
      if (existingConfigs.length > 0) {
        // Mettre à jour la première configuration trouvée
        return await this.updateConfiguration(existingConfigs[0].id, config, userId);
      } else {
        // Créer une nouvelle configuration
        return await this.saveConfiguration(config, userId);
      }

    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors de l\'upsert:', error);
      throw new Error('Impossible de sauvegarder la configuration webhook');
    }
  }
}
