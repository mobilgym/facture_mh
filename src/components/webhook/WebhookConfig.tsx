import React, { useState, useEffect } from 'react';
import { Settings, TestTube, CheckCircle, XCircle, Globe, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import { createN8nWebhookService } from '@/lib/services/webhook/n8nWebhookService';
import { WebhookConfiguration, WebhookConfigService } from '@/lib/services/webhook/webhookConfigService';
import { useAuth } from '@/contexts/AuthContext';

interface WebhookConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WebhookConfiguration) => void;
}

export default function WebhookConfig({ isOpen, onClose, onSave }: WebhookConfigProps) {
  const { user } = useAuth();
  
  const [config, setConfig] = useState<WebhookConfiguration>({
    url: '',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    enabled: false
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    responseTime: number;
  } | null>(null);

  // Charger la configuration au montage
  useEffect(() => {
    if (isOpen) {
      loadConfiguration();
    }
  }, [isOpen]);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      // Charger toutes les configurations pour récupérer l'ID
      const allConfigs = await WebhookConfigService.getAllConfigurations();
      
      if (allConfigs.length > 0) {
        const activeConfig = allConfigs.find(c => c.is_enabled) || allConfigs[0];
        setConfigId(activeConfig.id);
        setConfig({
          url: activeConfig.webhook_url,
          method: activeConfig.http_method,
          headers: activeConfig.headers as Record<string, string> || {},
          enabled: activeConfig.is_enabled,
          description: activeConfig.description,
          lastTestedAt: activeConfig.last_tested_at ? new Date(activeConfig.last_tested_at) : undefined,
          lastTestSuccess: activeConfig.last_test_success || undefined
        });
      } else {
        // Aucune configuration existante
        setConfigId(null);
        setConfig({
          url: '',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          enabled: false
        });
      }
      
      setTestResult(null);
      console.log('🔗 [WebhookConfig] Configuration globale chargée depuis Supabase');
    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors du chargement:', error);
      setTestResult({
        success: false,
        message: 'Erreur lors du chargement de la configuration',
        responseTime: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      setTestResult({
        success: false,
        message: 'Utilisateur non identifié',
        responseTime: 0
      });
      return;
    }

    setIsSaving(true);
    try {
      if (configId) {
        // Mettre à jour la configuration existante
        await WebhookConfigService.updateConfiguration(configId, config, user.id);
      } else {
        // Créer une nouvelle configuration
        const newConfig = await WebhookConfigService.saveConfiguration(config, user.id);
        setConfigId(newConfig.id);
      }
      
      onSave(config);
      onClose();
      console.log('✅ [WebhookConfig] Configuration globale sauvegardée');
    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors de la sauvegarde:', error);
      setTestResult({
        success: false,
        message: 'Erreur lors de la sauvegarde',
        responseTime: 0
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.url.trim()) {
      setTestResult({
        success: false,
        message: 'Veuillez entrer une URL de webhook',
        responseTime: 0
      });
      return;
    }

    if (!user?.id) {
      setTestResult({
        success: false,
        message: 'Utilisateur non identifié',
        responseTime: 0
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // Créer une instance temporaire pour le test
      const tempService = await createN8nWebhookService(user.id);
      tempService.updateConfig(config);
      
      const result = await tempService.testConnection(configId || undefined);
      setTestResult(result);
      
      console.log('🔗 [WebhookConfig] Test de connexion globale terminé:', result);
    } catch (error) {
      console.error('❌ [WebhookConfig] Erreur lors du test:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de test',
        responseTime: 0
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Chargement de la configuration...</span>
          </div>
        )}

        {!isLoading && (
          <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Configuration Webhook N8n (Globale)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Activation du webhook */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Activer le webhook</h3>
                <p className="text-sm text-gray-600">
                  Configuration globale - accessible à tous les utilisateurs
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* URL du webhook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL du Webhook N8n
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="url"
                value={config.url}
                onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://votre-n8n.com/webhook/extraction-facture"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              L'URL de votre workflow N8n qui recevra les fichiers pour extraction
            </p>
          </div>

          {/* Méthode HTTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Méthode HTTP
            </label>
            <select
              value={config.method}
              onChange={(e) => setConfig(prev => ({ ...prev, method: e.target.value as 'POST' | 'PUT' }))}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
          </div>

          {/* Headers personnalisés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Headers HTTP (optionnel)
            </label>
            <textarea
              value={JSON.stringify(config.headers, null, 2)}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value);
                  setConfig(prev => ({ ...prev, headers }));
                } catch (error) {
                  // Ignore les erreurs de parsing en temps réel
                }
              }}
              placeholder={`{
  "Content-Type": "application/json",
  "Authorization": "Bearer your-token"
}`}
              rows={4}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format JSON pour les headers HTTP personnalisés (authentification, etc.)
            </p>
          </div>

          {/* Test de connexion */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Test de Connexion</h3>
              <Button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection || !config.url.trim()}
                className="flex items-center space-x-2"
                variant="outline"
              >
                <TestTube className={`h-4 w-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
                <span>{isTestingConnection ? 'Test en cours...' : 'Tester'}</span>
              </Button>
            </div>

            {/* Résultat du test */}
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? 'Connexion réussie' : 'Échec de la connexion'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      testResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResult.message}
                    </p>
                    {testResult.responseTime > 0 && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          Temps de réponse: {testResult.responseTime}ms
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Format de réponse attendu */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Format de réponse attendu de N8n :</h4>
            <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`{
  "success": true,
  "data": {
    "companyName": "Amandine LE GOAREGUER",
    "amount": 150.00,
    "date": "2024-01-15"
  },
  "message": "Extraction réussie"
}`}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !config.url.trim()}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
        
        </>
        )}
        
      </div>
    </div>
  );
}
