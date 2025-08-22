import React, { useState } from 'react';
import { TestTube, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { n8nWebhookService } from '@/lib/services/webhook/n8nWebhookService';

interface WebhookDiagnosticProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WebhookDiagnostic({ isOpen, onClose }: WebhookDiagnosticProps) {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResult(null);

    const result = {
      timestamp: new Date().toISOString(),
      config: null as any,
      localStorage: null as any,
      serviceInstance: null as any,
      connectionTest: null as any,
      errors: [] as string[]
    };

    try {
      // 1. Vérifier la configuration
      console.log('🔗 [Diagnostic] Test 1: Vérification configuration');
      const config = (n8nWebhookService.constructor as any).loadConfig();
      result.config = config;
      
      if (!config.enabled) {
        result.errors.push('Webhook désactivé dans la configuration');
      }
      
      if (!config.url || config.url.trim() === '') {
        result.errors.push('URL du webhook manquante');
      }

      // 2. Vérifier le localStorage
      console.log('🔗 [Diagnostic] Test 2: Vérification localStorage');
      const localStorageData = localStorage.getItem('webhook_config');
      result.localStorage = localStorageData ? JSON.parse(localStorageData) : null;

      // 3. Vérifier l'instance du service
      console.log('🔗 [Diagnostic] Test 3: Vérification instance service');
      result.serviceInstance = {
        configUrl: (n8nWebhookService as any).config?.url,
        configEnabled: (n8nWebhookService as any).config?.enabled,
        configMethod: (n8nWebhookService as any).config?.method
      };

      // 4. Test de connexion si URL disponible
      if (config.url && config.url.trim() !== '') {
        console.log('🔗 [Diagnostic] Test 4: Test de connexion');
        try {
          const connectionTest = await n8nWebhookService.testConnection();
          result.connectionTest = connectionTest;
        } catch (error) {
          result.connectionTest = {
            success: false,
            message: error instanceof Error ? error.message : 'Erreur de connexion',
            responseTime: 0
          };
        }
      }

    } catch (error) {
      result.errors.push(`Erreur générale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    setDiagnosticResult(result);
    setIsRunning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TestTube className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Diagnostic Webhook N8n</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <Button
            onClick={runDiagnostic}
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            <TestTube className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Diagnostic en cours...' : 'Lancer le diagnostic'}</span>
          </Button>

          {diagnosticResult && (
            <div className="space-y-4">
              {/* Erreurs */}
              {diagnosticResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium text-red-800">Erreurs détectées</h3>
                  </div>
                  <ul className="list-disc list-inside text-red-700 space-y-1">
                    {diagnosticResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Configuration */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Configuration</h3>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(diagnosticResult.config, null, 2)}
                </pre>
              </div>

              {/* LocalStorage */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">LocalStorage</h3>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(diagnosticResult.localStorage, null, 2)}
                </pre>
              </div>

              {/* Instance du service */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-800 mb-2">Instance du Service</h3>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(diagnosticResult.serviceInstance, null, 2)}
                </pre>
              </div>

              {/* Test de connexion */}
              {diagnosticResult.connectionTest && (
                <div className={`border rounded-lg p-4 ${
                  diagnosticResult.connectionTest.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {diagnosticResult.connectionTest.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <h3 className={`font-medium ${
                      diagnosticResult.connectionTest.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Test de Connexion
                    </h3>
                  </div>
                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(diagnosticResult.connectionTest, null, 2)}
                  </pre>
                </div>
              )}

              {/* Conseils */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-medium text-yellow-800">Conseils de Résolution</h3>
                </div>
                <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                  <li>Vérifiez que l'URL du webhook est correcte et accessible</li>
                  <li>Assurez-vous que N8n est démarré et que le workflow est actif</li>
                  <li>Vérifiez les headers d'authentification si nécessaire</li>
                  <li>Testez l'URL directement dans votre navigateur ou Postman</li>
                  <li>Consultez les logs de N8n pour plus de détails</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="outline">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
