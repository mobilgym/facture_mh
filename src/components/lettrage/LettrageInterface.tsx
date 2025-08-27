import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Zap, Search, Filter, Eye, CheckCircle, XCircle, RotateCcw, Download } from 'lucide-react';
import { useLettrage } from '../../hooks/useLettrage';
import { useCompany } from '../../contexts/CompanyContext';
import { LettrageStats } from './LettrageStats';
import { LettrageCanvas } from './LettrageCanvas';
import { LettragePreview } from './LettragePreview';
import { CsvPaymentList } from './CsvPaymentList';
import { CsvColumnMapper } from './CsvColumnMapper';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { ProjectManager } from '../csvProjects/ProjectManager';
import type { LettrageState } from '../../types/lettrage';

export function LettrageInterface() {
  const { selectedCompany } = useCompany();
  const lettrage = useLettrage(selectedCompany?.id || '');
  
  const [activeTab, setActiveTab] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tolerance, setTolerance] = useState(0.01);
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<any>(null);
  
  // États pour la gestion des projets CSV
  const [currentCsvData, setCurrentCsvData] = useState<{
    fileName: string;
    data: string;
    headers: string[];
    columnMapping: {
      dateColumn: number;
      amountColumn: number;
      descriptionColumn: number | null;
    };
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Ouvrir le mapper de colonnes au lieu d'importer directement
    setSelectedFile(file);
    setShowColumnMapper(true);
    
    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMappingConfirmed = async (
    mapping: { dateColumn: number; amountColumn: number; descriptionColumn: number | null },
    headers: string[],
    allRows: string[][]
  ) => {
    try {
      await lettrage.importCsvFileWithMapping(headers, allRows, mapping);
      await lettrage.loadUnmatchedInvoices();
      
      // Sauvegarder les données CSV actuelles pour la gestion de projets
      if (selectedFile) {
        setCurrentCsvData({
          fileName: selectedFile.name,
          data: allRows.map(row => row.join(',')).join('\n'),
          headers,
          columnMapping: mapping
        });
      }
      
      setShowColumnMapper(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Erreur import avec mapping:', error);
    }
  };

  const handleMappingCancelled = () => {
    setShowColumnMapper(false);
    setSelectedFile(null);
  };

  const handleAutomaticMatching = async () => {
    try {
      await lettrage.runAutomaticMatching(tolerance);
    } catch (error) {
      console.error('Erreur matching:', error);
    }
  };

  const handleValidateAll = async () => {
    try {
      await lettrage.validateAllMatches();
      setShowPreview(false);
    } catch (error) {
      console.error('Erreur validation:', error);
    }
  };

  const handleInvoiceClick = (invoice: any) => {
    setSelectedInvoiceForDetails(invoice);
  };

  /**
   * Charger un projet CSV depuis la gestion de projets
   */
  const handleLoadProject = async (projectData: {
    csvData: string;
    headers: string[];
    columnMapping: any;
    lettrageState?: LettrageState;
  }) => {
    try {
      console.log('🔄 Chargement projet CSV:', projectData);
      
      // Parser les données CSV
      const csvRows = projectData.csvData.split('\n').map(row => row.split(','));
      
      // Importer les données CSV
      await lettrage.importCsvFileWithMapping(
        projectData.headers, 
        csvRows, 
        projectData.columnMapping
      );
      
      // Charger les factures non lettrées
      await lettrage.loadUnmatchedInvoices();
      
      // Restaurer l'état du lettrage s'il existe
      if (projectData.lettrageState) {
        await lettrage.restoreState(projectData.lettrageState);
      }
      
      // Mettre à jour les données CSV actuelles
      setCurrentCsvData({
        fileName: 'projet-csv.csv', // Nom générique pour les projets chargés
        data: projectData.csvData,
        headers: projectData.headers,
        columnMapping: projectData.columnMapping
      });
      
      console.log('✅ Projet chargé avec succès');
    } catch (error) {
      console.error('❌ Erreur chargement projet:', error);
    }
  };

  /**
   * Obtenir l'état actuel du lettrage pour la sauvegarde
   */
  const getCurrentLettrageState = (): LettrageState => {
    return {
      csvPayments: lettrage.csvPayments,
      matches: lettrage.matches,
      unmatchedInvoices: lettrage.unmatchedInvoices,
      unmatchedPayments: lettrage.unmatchedPayments,
      isLoading: false,
      error: null
    };
  };

  const stats = lettrage.getStats();
  const filteredPayments = lettrage.searchPayments(searchQuery);

  // Filtrer selon l'onglet actif
  const getFilteredData = () => {
    switch (activeTab) {
      case 'matched':
        return {
          invoices: lettrage.unmatchedInvoices.filter(inv => 
            lettrage.matches.some(m => m.invoiceId === inv.id)
          ),
          payments: lettrage.csvPayments.filter(pay => pay.isMatched),
          matches: lettrage.matches
        };
      case 'unmatched':
        return {
          invoices: lettrage.unmatchedInvoices.filter(inv => 
            !lettrage.matches.some(m => m.invoiceId === inv.id)
          ),
          payments: lettrage.unmatchedPayments,
          matches: []
        };
      default:
        return {
          invoices: lettrage.unmatchedInvoices,
          payments: lettrage.csvPayments,
          matches: lettrage.matches
        };
    }
  };

  const filteredData = getFilteredData();

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Sélectionnez une entreprise pour commencer</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et actions principales */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎯 Lettrage Automatique
            </h2>
            <p className="text-gray-600">
              Importez vos paiements CSV et connectez-les automatiquement à vos factures
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Import CSV */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={lettrage.isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Importer CSV
            </button>

            {/* Matching automatique */}
            {lettrage.csvPayments.length > 0 && (
              <button
                onClick={handleAutomaticMatching}
                disabled={lettrage.isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                Matching Auto
              </button>
            )}

            {/* Reset */}
            {lettrage.csvPayments.length > 0 && (
              <button
                onClick={lettrage.resetLettrage}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuration et période */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Période de recherche
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={lettrage.selectedPeriod.startDate}
              onChange={(e) => lettrage.updatePeriod(e.target.value, lettrage.selectedPeriod.endDate)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={lettrage.selectedPeriod.endDate}
              onChange={(e) => lettrage.updatePeriod(lettrage.selectedPeriod.startDate, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tolérance de matching (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={tolerance}
            onChange={(e) => setTolerance(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recherche dans CSV
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Montant, date, description..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Gestionnaire de projets CSV */}
      <ProjectManager
        currentCsvData={currentCsvData}
        currentLettrageState={getCurrentLettrageState()}
        onLoadProject={handleLoadProject}
        onProjectSaved={() => {
          console.log('✅ Projet sauvegardé avec succès');
        }}
      />

      {/* Statistiques */}
      {lettrage.csvPayments.length > 0 && (
        <LettrageStats stats={stats} />
      )}

      {/* Onglets et mode d'affichage */}
      {lettrage.csvPayments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {/* Onglets */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🎯 Tout ({stats.totalInvoices + stats.totalPayments})
              </button>
              <button
                onClick={() => setActiveTab('matched')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'matched'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✅ Lettrés ({stats.matchedInvoices})
              </button>
              <button
                onClick={() => setActiveTab('unmatched')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'unmatched'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⏳ Non lettrés ({stats.unmatchedInvoices + stats.unmatchedPayments})
              </button>
            </div>

            {/* Mode d'affichage */}
            <div className="flex items-center gap-2">
              {lettrage.matches.length > 0 && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Aperçu
                </button>
              )}
              
              <button
                onClick={() => setIsCanvasMode(!isCanvasMode)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isCanvasMode
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎨 Mode Canvas
              </button>

              {lettrage.matches.length > 0 && (
                <button
                  onClick={handleValidateAll}
                  disabled={lettrage.isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Valider Tout
                </button>
              )}
            </div>
          </div>

          {/* Contenu selon le mode */}
          <div className="p-6">
            {showPreview ? (
              <LettragePreview
                matches={lettrage.matches}
                invoices={lettrage.unmatchedInvoices}
                payments={lettrage.csvPayments}
                onValidate={handleValidateAll}
                onCancel={() => setShowPreview(false)}
                onInvoiceClick={handleInvoiceClick}
              />
            ) : isCanvasMode ? (
              <LettrageCanvas
                invoices={filteredData.invoices}
                payments={filteredData.payments}
                matches={filteredData.matches}
                onAddMatch={lettrage.addManualMatch}
                onRemoveMatch={lettrage.removeMatch}
                onInvoiceClick={handleInvoiceClick}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Liste des factures */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📄 Factures ({filteredData.invoices.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredData.invoices.map(invoice => {
                      const isMatched = lettrage.matches.some(m => m.invoiceId === invoice.id);
                      return (
                        <div
                          key={invoice.id}
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            isMatched
                              ? 'border-green-200 bg-green-50 hover:border-green-300'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                          onClick={() => handleInvoiceClick(invoice)}
                          title="Cliquer pour voir les détails"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 flex items-center gap-2">
                                {invoice.name}
                                <span className="text-xs text-blue-600">🔍</span>
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(invoice.document_date || '').toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {new Intl.NumberFormat('fr-FR', { 
                                  style: 'currency', 
                                  currency: 'EUR' 
                                }).format(invoice.amount || 0)}
                              </p>
                              {isMatched && (
                                <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  Lettré
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Liste des paiements CSV */}
                <CsvPaymentList
                  payments={filteredData.payments}
                  matches={lettrage.matches}
                  searchQuery={searchQuery}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* État initial */}
      {lettrage.csvPayments.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Commencez par importer votre fichier CSV
          </h3>
          <p className="text-gray-600 mb-6">
            Le fichier doit contenir les colonnes "date" et "montant"
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Choisir un fichier CSV
          </button>
        </div>
      )}

      {/* Mapper de colonnes CSV */}
      <CsvColumnMapper
        file={selectedFile}
        isOpen={showColumnMapper}
        onMappingConfirmed={handleMappingConfirmed}
        onCancel={handleMappingCancelled}
      />

      {/* Modal des détails de facture */}
      <InvoiceDetailsModal
        invoice={selectedInvoiceForDetails}
        isOpen={!!selectedInvoiceForDetails}
        onClose={() => setSelectedInvoiceForDetails(null)}
      />
    </div>
  );
}
