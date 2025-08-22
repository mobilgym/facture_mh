import { useState, useEffect, useCallback } from 'react';
import { isImageFile, processFileForUpload } from '@/lib/utils/imageConverter';

interface UseFilePreprocessorOptions {
  autoConvert?: boolean;
  quality?: number;
}

interface PreprocessorState {
  originalFile: File | null;
  processedFile: File | null;
  isProcessing: boolean;
  hasConverted: boolean;
  processingProgress: number;
  processingMessage: string;
  error: string | null;
}

export function useFilePreprocessor(
  inputFile: File | null,
  options: UseFilePreprocessorOptions = {}
) {
  const { autoConvert = true, quality = 0.9 } = options;

  const [state, setState] = useState<PreprocessorState>({
    originalFile: null,
    processedFile: null,
    isProcessing: false,
    hasConverted: false,
    processingProgress: 0,
    processingMessage: '',
    error: null
  });

  // Fonction pour traiter un fichier
  const processFile = useCallback(async (file: File) => {
    if (!file) return;

    console.log('🔄 Démarrage du préprocessing pour:', file.name);
    
    setState(prev => ({
      ...prev,
      originalFile: file,
      isProcessing: true,
      processingProgress: 0,
      processingMessage: 'Initialisation...',
      error: null
    }));

    try {
      // Si ce n'est pas une image, retourner le fichier tel quel
      if (!isImageFile(file)) {
        console.log('📄 Fichier non-image, aucune conversion nécessaire');
        setState(prev => ({
          ...prev,
          processedFile: file,
          isProcessing: false,
          hasConverted: false,
          processingProgress: 100,
          processingMessage: 'Fichier prêt'
        }));
        return;
      }

      // Convertir l'image en PDF
      setState(prev => ({
        ...prev,
        processingProgress: 20,
        processingMessage: 'Conversion de l\'image en PDF...'
      }));

      const processedFile = await processFileForUpload(file, quality);

      setState(prev => ({
        ...prev,
        processedFile,
        isProcessing: false,
        hasConverted: true,
        processingProgress: 100,
        processingMessage: 'Conversion terminée !'
      }));

      console.log('✅ Conversion automatique réussie:', processedFile.name);

    } catch (error) {
      console.error('❌ Erreur lors du préprocessing:', error);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Erreur de conversion',
        processingMessage: 'Erreur de conversion'
      }));
    }
  }, [quality]);

  // Déclencher le traitement automatique quand le fichier change
  useEffect(() => {
    if (inputFile && autoConvert) {
      processFile(inputFile);
    } else if (inputFile && !autoConvert) {
      // Si pas de conversion automatique, juste stocker le fichier original
      setState(prev => ({
        ...prev,
        originalFile: inputFile,
        processedFile: inputFile,
        isProcessing: false,
        hasConverted: false,
        processingProgress: 100,
        processingMessage: 'Fichier prêt'
      }));
    } else {
      // Reset si pas de fichier
      setState({
        originalFile: null,
        processedFile: null,
        isProcessing: false,
        hasConverted: false,
        processingProgress: 0,
        processingMessage: '',
        error: null
      });
    }
  }, [inputFile, autoConvert, processFile]);

  // Fonction pour relancer manuellement le traitement
  const reprocess = useCallback(() => {
    if (state.originalFile) {
      processFile(state.originalFile);
    }
  }, [state.originalFile, processFile]);

  // Fonction pour utiliser le fichier original sans conversion
  const useOriginal = useCallback(() => {
    if (state.originalFile) {
      setState(prev => ({
        ...prev,
        processedFile: prev.originalFile,
        hasConverted: false,
        error: null,
        processingMessage: 'Fichier original utilisé'
      }));
    }
  }, [state.originalFile]);

  return {
    // État actuel
    originalFile: state.originalFile,
    processedFile: state.processedFile,
    isProcessing: state.isProcessing,
    hasConverted: state.hasConverted,
    processingProgress: state.processingProgress,
    processingMessage: state.processingMessage,
    error: state.error,
    
    // Métadonnées utiles
    isImageFile: state.originalFile ? isImageFile(state.originalFile) : false,
    originalSize: state.originalFile?.size || 0,
    processedSize: state.processedFile?.size || 0,
    compressionRatio: state.originalFile && state.processedFile 
      ? ((state.originalFile.size - state.processedFile.size) / state.originalFile.size * 100)
      : 0,
    
    // Actions disponibles
    reprocess,
    useOriginal,
    
    // Fichier à utiliser pour l'upload ou les webhooks
    fileToUse: state.processedFile || state.originalFile
  };
}
