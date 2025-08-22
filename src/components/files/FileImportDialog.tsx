import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Building2, EuroIcon, FileText, FileImage, Wallet, Tag, Brain, Loader2, Sparkles, Globe, Settings, TestTube } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanies } from '@/hooks/useCompanies';
import { useBudgets } from '@/hooks/useBudgets';
import { useBudgetBadges } from '@/hooks/useBudgetBadges';
import { isImageFile, getFileTypeDescription } from '@/lib/utils/imageConverter';
import Button from '@/components/ui/Button';
import PercentageSlider from '@/components/ui/PercentageSlider';
import { DocumentType } from './TypeSelectionDialog';
import { BadgeSelector } from '@/components/badges/BadgeSelector';
import type { Badge } from '@/types/badge';
import { enhancedDocumentAnalyzer, ExtractedDocumentData } from '@/lib/services/document/enhancedDocumentAnalyzer';
import { n8nWebhookService, WebhookExtractedData } from '@/lib/services/webhook/n8nWebhookService';
import WebhookConfig from '@/components/webhook/WebhookConfig';
import WebhookDiagnostic from '@/components/webhook/WebhookDiagnostic';

interface FileImportDialogProps {
  file: File;
  documentType: DocumentType;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fileName: string, date: Date, amount: number | null, budgetId?: string | null, badgeIds?: string[]) => void;
}

// Fonction utilitaire pour les couleurs de confiance
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return 'bg-green-500'; // Très bonne confiance
  if (confidence >= 60) return 'bg-yellow-500'; // Confiance moyenne
  if (confidence >= 40) return 'bg-orange-500'; // Confiance faible
  return 'bg-red-500'; // Très faible confiance
};

export default function FileImportDialog({ file, documentType, isOpen, onClose, onConfirm }: FileImportDialogProps) {
  const [fileName, setFileName] = useState(() => {
    return documentType === 'achat' ? 'Ach_.pdf' : 'Vte_.pdf';
  });
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [amount, setAmount] = useState<string>('');
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [badgeIds, setBadgeIds] = useState<string[]>([]);
  
  // États pour le système de pourcentage
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [retentionPercentage, setRetentionPercentage] = useState<number>(100);
  const [usePercentageMode, setUsePercentageMode] = useState<boolean>(false);
  
  // États pour l'extraction webhook
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionMessage, setExtractionMessage] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null);
  const [hasExtracted, setHasExtracted] = useState(false);
  
  // États pour la configuration webhook
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [showWebhookDiagnostic, setShowWebhookDiagnostic] = useState(false);
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  
  const { companies } = useCompanies();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { badges: availableBadges, loading: badgesLoading } = useBudgetBadges(budgetId);
  const [error, setError] = useState<string | null>(null);

  // Fonction d'extraction via webhook N8n
  const extractDataWithWebhook = async () => {
    if (!file || isExtracting) return;

    console.log('🔗 Démarrage de l\'extraction via webhook N8n...');
    setIsExtracting(true);
    setExtractionProgress(0);
    setExtractionMessage('Préparation de l\'envoi...');

    try {
      // Simulation de progression
      setExtractionProgress(20);
      setExtractionMessage('Conversion du fichier...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setExtractionProgress(50);
      setExtractionMessage('Envoi vers N8n...');
      
      const results = await n8nWebhookService.extractDataFromFile(file, documentType);
      
      setExtractionProgress(90);
      setExtractionMessage('Traitement de la réponse...');
      
      if (results.success) {
        // Convertir les résultats webhook vers le format ExtractedDocumentData
        const convertedResults: ExtractedDocumentData = {
          companyName: null, // Sera déduit du fileName
          date: results.date ? new Date(results.date) : null,
          amount: results.amount,
          fileName: results.fileName || `${documentType === 'achat' ? 'Ach' : 'Vte'}_document.pdf`,
          confidence: 85 // Confiance élevée pour les webhooks
        };

        setExtractedData(convertedResults);
        setHasExtracted(true);

        // Pré-remplir les champs avec les données extraites
        if (results.fileName) {
          setFileName(results.fileName);
          console.log('✅ Webhook - Nom de fichier pré-rempli:', results.fileName);
        }

        if (results.date) {
          setDate(new Date(results.date));
          console.log('✅ Webhook - Date pré-remplie:', results.date);
        }

        if (results.amount) {
          setAmount(results.amount.toString());
          setTotalAmount(results.amount);
          setUsePercentageMode(true);
          console.log('✅ Webhook - Montant pré-rempli:', results.amount);
        }

        setExtractionProgress(100);
        setExtractionMessage('Extraction terminée !');

        console.log('✅ Extraction webhook terminée avec succès:', results);
      } else {
        throw new Error(results.message || 'Échec de l\'extraction webhook');
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction webhook:', error);
      setExtractionMessage(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setHasExtracted(false);
    } finally {
      setIsExtracting(false);
    }
  };

  // Gestionnaire du bouton webhook
  const handleWebhookExtraction = () => {
    console.log('🔗 [FileImportDialog] Clic sur bouton webhook');
    console.log('🔗 [FileImportDialog] Webhook activé:', webhookEnabled);
    
    if (!webhookEnabled) {
      console.log('🔗 [FileImportDialog] Webhook non activé, ouverture de la configuration');
      // Ouvrir la configuration si le webhook n'est pas activé
      setShowWebhookConfig(true);
      return;
    }

    console.log('🔗 [FileImportDialog] Lancement de l\'extraction webhook');
    // Lancer l'extraction via webhook
    setHasExtracted(false);
    setExtractedData(null);
    extractDataWithWebhook();
  };

  // Gestionnaire de sauvegarde de la configuration webhook
  const handleWebhookConfigSave = (config: any) => {
    setWebhookEnabled(config.enabled);
    if (config.enabled && file) {
      // Si le webhook vient d'être activé, proposer l'extraction
      setTimeout(() => {
        extractDataWithWebhook();
      }, 500);
    }
  };

  // Initialisation au montage
  useEffect(() => {
    // Charger la configuration webhook
    const config = (n8nWebhookService.constructor as any).loadConfig();
    setWebhookEnabled(config.enabled);
    
    // Réinitialiser les préfixes par défaut à l'ouverture
    if (isOpen && !hasExtracted) {
      setFileName(documentType === 'achat' ? 'Ach_.pdf' : 'Vte_.pdf');
    }
  }, [isOpen, documentType]);

     // Fonction pour gérer le changement de montant
   const handleAmountChange = (value: string) => {
     setAmount(value);
     const numericValue = parseFloat(value);
     if (!isNaN(numericValue) && numericValue > 0) {
       setTotalAmount(numericValue);
       // Ne pas activer automatiquement le mode pourcentage pendant la saisie
       // L'utilisateur devra cliquer sur "Mode %" pour l'activer
     } else {
       // Désactiver le mode pourcentage si le montant devient invalide
       if (usePercentageMode) {
         setUsePercentageMode(false);
       }
     }
   };

   // Calculer le montant final basé sur le pourcentage
   const getFinalAmount = (): number => {
     if (usePercentageMode && totalAmount > 0) {
       return (totalAmount * retentionPercentage) / 100;
     }
     return parseFloat(amount) || 0;
   };

   // Fonction pour basculer entre les modes
   const togglePercentageMode = () => {
     if (!usePercentageMode && totalAmount > 0) {
       setUsePercentageMode(true);
     } else {
       setUsePercentageMode(false);
       // Mettre à jour le montant avec la valeur calculée
       const finalAmount = getFinalAmount();
       setAmount(finalAmount > 0 ? finalAmount.toString() : '');
     }
   };

     // Nettoyage à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setIsExtracting(false);
      setExtractionProgress(0);
      setExtractionMessage('');
      setExtractedData(null);
      setHasExtracted(false);
      setUsePercentageMode(false);
      setRetentionPercentage(100);
      setTotalAmount(0);
      setShowWebhookConfig(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBudgetChange = (newBudgetId: string | null) => {
    setBudgetId(newBudgetId);
    // Réinitialiser les badges si le budget change
    setBadgeIds([]);
  };

  const handleBadgeSelect = (badge: Badge) => {
    if (!badgeIds.includes(badge.id)) {
      setBadgeIds([...badgeIds, badge.id]);
    }
  };

  const handleBadgeRemove = (badgeId: string) => {
    setBadgeIds(badgeIds.filter(id => id !== badgeId));
  };

  // Filtre temporaire - tous les budgets pour diagnostic
  const activeBudgets = budgets?.filter(budget => budget.is_active === true) || [];
  // Si toujours vide, essayons tous les budgets
  const allBudgetsIfNeeded = activeBudgets.length === 0 ? (budgets || []) : activeBudgets;
  const selectedBadges = availableBadges?.filter(badge => badgeIds.includes(badge.id)) || [];

  // Debug logs (temporaire)
  console.log('🔍 FileImportDialog - selectedCompany:', selectedCompany);
  console.log('🔍 FileImportDialog - budgets total:', budgets?.length);
  console.log('🔍 FileImportDialog - budgets data:', budgets);
  console.log('🔍 FileImportDialog - premier budget status:', budgets?.[0]?.status);
  console.log('🔍 FileImportDialog - premier budget is_active:', budgets?.[0]?.is_active);
  console.log('🔍 FileImportDialog - structure du premier budget:', Object.keys(budgets?.[0] || {}));
  console.log('🔍 FileImportDialog - activeBudgets count:', activeBudgets.length);
  console.log('🔍 FileImportDialog - allBudgetsIfNeeded count:', allBudgetsIfNeeded.length);
  console.log('🔍 FileImportDialog - budgetsLoading:', budgetsLoading);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      setError('Veuillez sélectionner une société');
      return;
    }

    if (!file) {
      setError('Aucun fichier à importer');
      return;
    }

    if (!date) {
      setError('Veuillez sélectionner une date');
      return;
    }

    // Validation : si un badge est sélectionné, un budget doit être sélectionné
    if (badgeIds.length > 0 && !budgetId) {
      setError('Veuillez sélectionner un budget si vous voulez assigner des badges');
      return;
    }

         // Utiliser le montant final calculé (avec ou sans pourcentage)
     const finalAmount = getFinalAmount();
     const parsedAmount = finalAmount > 0 ? finalAmount : null;
     
     if (amount && finalAmount < 0) {
       setError('Le montant doit être un nombre positif');
       return;
     }

     setError(null);
     onConfirm(fileName, date, parsedAmount, budgetId, badgeIds);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Importer le fichier</h2>
          
          {/* Boutons Webhook */}
          <div className="flex items-center space-x-1">
            {/* Bouton Diagnostic */}
            <button
              onClick={() => setShowWebhookDiagnostic(true)}
              className="flex items-center space-x-1 px-2 py-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
              title="Diagnostic webhook"
            >
              <TestTube className="h-4 w-4" />
            </button>
            
            {/* Bouton Configuration Webhook */}
            <button
              onClick={() => setShowWebhookConfig(true)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              title="Configurer le webhook N8n"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </button>
            
            {/* Bouton Extraction Webhook */}
            <button
              onClick={handleWebhookExtraction}
              disabled={isExtracting}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                webhookEnabled
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              } ${
                isExtracting
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105'
              }`}
              title={webhookEnabled ? 'Extraire les données via webhook N8n' : 'Configurer le webhook pour activer l\'extraction'}
            >
              <Globe className={`h-4 w-4 ${isExtracting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {webhookEnabled ? (isExtracting ? 'Extraction...' : 'Webhook') : 'Activer'}
              </span>
            </button>
          </div>
        </div>
        
        {/* Informations sur le fichier */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            {isImageFile(file) ? (
              <FileImage className="h-5 w-5 text-orange-600" />
            ) : (
              <FileText className="h-5 w-5 text-blue-600" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {getFileTypeDescription(file)} • {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
          
          {/* Statut de l'extraction webhook */}
          {isExtracting && (
            <div className="mt-3 p-2 rounded border bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-blue-600 animate-pulse" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-700">
                    🔗 Extraction via webhook N8n...
                  </p>
                  <p className="text-xs mt-1 text-blue-600">
                    {extractionMessage}
                  </p>
                  <div className="mt-2 rounded-full h-1.5 overflow-hidden bg-blue-200">
                    <div 
                      className="h-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-green-500"
                      style={{ width: `${extractionProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Résultats de l'extraction webhook */}
          {hasExtracted && !isExtracting && (
            <div className={`mt-3 p-3 rounded-lg border ${extractedData && (extractedData.fileName || extractedData.date || extractedData.amount) 
              ? 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200'
              : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-start space-x-2">
                <Globe className={`h-4 w-4 mt-0.5 ${extractedData && (extractedData.fileName || extractedData.date || extractedData.amount) 
                  ? 'text-blue-600' 
                  : 'text-yellow-600'}`} />
                <div className="flex-1 min-w-0">
                  {extractedData && (extractedData.fileName || extractedData.date || extractedData.amount) ? (
                    <p className="text-sm font-semibold mb-2 text-blue-700">
                      ✅ Extraction Webhook N8n Terminée
                    </p>
                  ) : (
                    <div>
                      <p className="text-sm text-yellow-700 font-semibold mb-2">
                        ⚠️ Webhook Terminé - Extraction Partielle
                      </p>
                      <p className="text-xs text-yellow-600 mb-2">
                        Le webhook N8n n'a pas pu extraire toutes les informations. Vérifiez la configuration ou saisissez manuellement.
                      </p>
                      <div className="bg-blue-100 p-2 rounded text-xs mb-2">
                        <p className="font-medium text-blue-800 mb-1">🔗 Suggestion :</p>
                        <p className="text-blue-700">Vérifiez que votre workflow N8n renvoie les bonnes données au format JSON attendu.</p>
                      </div>
                      <div className="bg-yellow-100 p-2 rounded text-xs">
                        <p className="font-medium text-yellow-800 mb-1">💡 Conseils :</p>
                        <ul className="text-yellow-700 space-y-1 list-disc list-inside">
                          <li>Vérifiez l'URL du webhook dans la configuration</li>
                          <li>Assurez-vous que N8n est bien configuré</li>
                          <li>Consultez les logs de votre workflow N8n</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    
                    {/* Entreprise détectée */}
                    {extractedData?.companyName && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-green-600">
                          <Building2 className="h-3 w-3 inline mr-1" />
                          <strong>Entreprise:</strong> {extractedData.companyName}
                        </p>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${getConfidenceColor(extractedData.confidence?.companyName || 0)}`}></div>
                          <span className="text-xs text-gray-500">
                            {extractedData.confidence?.companyName || 0}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Date détectée */}
                    {extractedData?.date && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-green-600">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          <strong>Date:</strong> {format(extractedData.date, 'dd/MM/yyyy')}
                        </p>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${getConfidenceColor(extractedData.confidence?.date || 0)}`}></div>
                          <span className="text-xs text-gray-500">
                            {extractedData.confidence?.date || 0}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Montant détecté */}
                    {extractedData?.amount && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-green-600">
                          <EuroIcon className="h-3 w-3 inline mr-1" />
                          <strong>Montant:</strong> {extractedData.amount.toFixed(2)}€
                        </p>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${getConfidenceColor(extractedData.confidence?.amount || 0)}`}></div>
                          <span className="text-xs text-gray-500">
                            {extractedData.confidence?.amount || 0}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Nom de fichier généré */}
                    {extractedData?.fileName && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-green-600">
                          <FileText className="h-3 w-3 inline mr-1" />
                          <strong>Fichier:</strong> <code className="bg-green-100 px-1 rounded text-xs">{extractedData.fileName}</code>
                        </p>
                        <span className="text-xs text-blue-600 font-medium">
                          {documentType === 'achat' ? 'ACH_' : 'VTE_'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-xs text-green-600 font-medium">
                      💡 Champs automatiquement pré-remplis - Modifiez si nécessaire
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isImageFile(file) && (
            <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
              <p className="text-xs text-orange-700 flex items-center">
                <FileImage className="h-3 w-3 mr-1" />
                Cette image sera automatiquement convertie en PDF lors de l'import
              </p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Société
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                  const company = companies.find(c => c.id === e.target.value);
                  setSelectedCompany(company || null);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner une société</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du fichier
              {extractedData?.companyName && (
                <span className="text-xs text-green-600 ml-2">
                  (basé sur: {extractedData.companyName})
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {!isExtracting && !hasExtracted && (
                <button
                  type="button"
                  onClick={() => {
                    // Analyser avec l'OCR traditionnel Tesseract
                    console.log('🔍 Démarrage OCR Tesseract...');
                    setIsExtracting(true);
                    setExtractionMessage('Analyse OCR Tesseract...');
                    enhancedDocumentAnalyzer.analyzeDocument(file, documentType, {
                      onProgress: (progress, message) => {
                        setExtractionProgress(progress);
                        setExtractionMessage(message);
                      }
                    }).then((results) => {
                      setExtractedData(results);
                      setHasExtracted(true);
                      if (results.fileName) setFileName(results.fileName);
                      if (results.date) setDate(results.date);
                      if (results.amount) {
                        setAmount(results.amount.toString());
                        setTotalAmount(results.amount);
                        setUsePercentageMode(true);
                      }
                      setExtractionMessage('OCR Tesseract terminé !');
                    }).catch((error) => {
                      console.error('❌ Erreur OCR Tesseract:', error);
                      setExtractionMessage('Erreur OCR Tesseract');
                    }).finally(() => {
                      setIsExtracting(false);
                    });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Analyser avec OCR Tesseract (local)"
                >
                  <Brain className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date du document
              {extractedData?.date && (
                <span className="text-xs text-green-600 ml-2">
                  (détectée automatiquement)
                </span>
              )}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={format(date, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  newDate.setHours(0, 0, 0, 0);
                  setDate(newDate);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

                     <div>
             <div className="flex items-center justify-between mb-2">
               <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                 <EuroIcon className="h-4 w-4" />
                 <span>
                   {usePercentageMode ? 'Montant total' : 'Montant (optionnel)'}
                   {extractedData?.amount && (
                     <span className="text-xs text-green-600 ml-2">
                       (détecté automatiquement)
                     </span>
                   )}
                 </span>
               </label>
               
               {totalAmount > 0 && (
                 <button
                   type="button"
                   onClick={togglePercentageMode}
                   className={`
                     text-xs px-3 py-1.5 rounded-md transition-all duration-200 font-medium
                     ${usePercentageMode 
                       ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                       : 'bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-sm'
                     }
                   `}
                   title={usePercentageMode ? 'Revenir à la saisie directe' : 'Utiliser un pourcentage du montant'}
                 >
                   {usePercentageMode ? '📝 Saisie directe' : '🎛️ Mode %'}
                 </button>
               )}
             </div>
             
             <div className="relative">
               <EuroIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
               <input
                 type="number"
                 step="0.01"
                 min="0"
                 value={amount}
                 onChange={(e) => handleAmountChange(e.target.value)}
                 placeholder="0.00"
                 disabled={usePercentageMode}
                 className={`
                   w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                   ${usePercentageMode ? 'bg-gray-50 cursor-not-allowed' : ''}
                 `}
               />
               {usePercentageMode && (
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                   Total
                 </div>
               )}
             </div>
             
             {/* Message d'aide pour le mode pourcentage */}
             {totalAmount > 0 && !usePercentageMode && (
               <div className="mt-1 text-xs text-gray-500 flex items-center space-x-1">
                 <span>💡</span>
                 <span>Cliquez sur "🎛️ Mode %" pour ajuster le pourcentage à retenir</span>
               </div>
             )}
             
             {/* Curseur de pourcentage */}
             {usePercentageMode && totalAmount > 0 && (
               <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                 <PercentageSlider
                   totalAmount={totalAmount}
                   percentage={retentionPercentage}
                   onPercentageChange={setRetentionPercentage}
                   label="Pourcentage à retenir"
                   showManualInput={true}
                 />
                 
                 {/* Récapitulatif */}
                 <div className="mt-3 pt-3 border-t border-blue-200">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-600">Montant qui sera enregistré :</span>
                     <span className="font-bold text-blue-700">
                       {getFinalAmount().toFixed(2)}€
                     </span>
                   </div>
                   {retentionPercentage < 100 && (
                     <div className="text-xs text-orange-600 mt-1">
                       ⚠️ Seuls {retentionPercentage}% du montant total seront enregistrés
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>

          {/* Section Budget et Badges - Optionnelle */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center mb-3">
              <Tag className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Attribution budgétaire (optionnel)
              </span>
            </div>

            {/* Sélection du Budget */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={budgetId || ''}
                  onChange={(e) => handleBudgetChange(e.target.value || null)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={budgetsLoading || !selectedCompany}
                >
                  <option value="">Aucun budget sélectionné</option>
                  {allBudgetsIfNeeded.map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name} ({(budget.initial_amount - budget.spent_amount).toFixed(2)}€ disponible)
                    </option>
                  ))}
                </select>
              </div>
              {budgetsLoading && (
                <p className="text-xs text-gray-500 mt-1">Chargement des budgets...</p>
              )}
              {!budgetsLoading && (!allBudgetsIfNeeded || allBudgetsIfNeeded.length === 0) && (
                <p className="text-xs text-amber-600 mt-1">
                  Aucun budget actif disponible. Vous pouvez en créer dans la section "Budgets et Dépenses".
                </p>
              )}
            </div>

            {/* Sélection des Badges */}
            {budgetId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badges
                </label>
                <div className="space-y-2">
                  <BadgeSelector
                    selectedBadges={selectedBadges}
                    availableBadges={availableBadges || []}
                    onBadgeSelect={handleBadgeSelect}
                    onBadgeRemove={handleBadgeRemove}
                    placeholder="Aucun badge sélectionné"
                  />
                </div>
                {badgesLoading && (
                  <p className="text-xs text-gray-500 mt-1">Chargement des badges...</p>
                )}
                {budgetId && (!availableBadges || availableBadges.length === 0) && !badgesLoading && (
                  <p className="text-xs text-amber-600 mt-1">
                    Aucun badge disponible pour ce budget. 
                    Vous pouvez en créer dans la section "Budgets et Dépenses".
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Importer
            </Button>
          </div>
        </form>
        
        {/* Configuration Webhook */}
        <WebhookConfig
          isOpen={showWebhookConfig}
          onClose={() => setShowWebhookConfig(false)}
          onSave={handleWebhookConfigSave}
        />
        
        {/* Diagnostic Webhook */}
        <WebhookDiagnostic
          isOpen={showWebhookDiagnostic}
          onClose={() => setShowWebhookDiagnostic(false)}
        />
      </div>
    </div>
  );
}