import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Zap, Search, Eye, CheckCircle, RotateCcw } from 'lucide-react';
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
        <div className="glass-panel rounded-xl px-4 py-3">
          <p className="text-fit-sm text-gray-600">Sélectionnez une entreprise pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 budget-container">
      {/* En-tête avec titre et actions principales */}
      <div className="glass-panel-strong rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-cyan-50/80 via-white/70 to-emerald-50/70 budget-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-fit-lg font-semibold text-gray-900 mb-2 tracking-tight">
              🎯 Lettrage Automatique
            </h2>
            <p className="text-fit-sm text-gray-600">
              Importez vos paiements CSV et connectez-les automatiquement à vos factures
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
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
              className="inline-flex items-center gap-2 px-3 py-1.5 neon-cta text-fit-xs disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              Importer CSV
            </button>

            {/* Matching automatique */}
            {lettrage.csvPayments.length > 0 && (
              <button
                onClick={handleAutomaticMatching}
                disabled={lettrage.isLoading}
                className="inline-flex items-center gap-2 px-3 py-1.5 neon-cta-outline text-fit-xs disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                Matching Auto
              </button>
            )}

            {/* Reset */}
            {lettrage.csvPayments.length > 0 && (
              <button
                onClick={lettrage.resetLettrage}
                className="inline-flex items-center gap-2 px-3 py-1.5 neon-cta-outline text-fit-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuration et période */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-panel rounded-xl p-3 sm:p-4 budget-container">
          <label className="block text-fit-xs font-semibold text-gray-700 mb-2">
            Période de recherche
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={lettrage.selectedPeriod.startDate}
              onChange={(e) => lettrage.updatePeriod(e.target.value, lettrage.selectedPeriod.endDate)}
              className="w-full px-3 py-2 text-fit-xs border border-cyan-100/80 rounded-lg bg-white/80 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
            <input
              type="date"
              value={lettrage.selectedPeriod.endDate}
              onChange={(e) => lettrage.updatePeriod(lettrage.selectedPeriod.startDate, e.target.value)}
              className="w-full px-3 py-2 text-fit-xs border border-cyan-100/80 rounded-lg bg-white/80 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-3 sm:p-4 budget-container">
          <label className="block text-fit-xs font-semibold text-gray-700 mb-2">
            Tolérance de matching (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={tolerance}
            onChange={(e) => setTolerance(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-fit-xs border border-cyan-100/80 rounded-lg bg-white/80 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          />
        </div>

        <div className="glass-panel rounded-xl p-3 sm:p-4 budget-container">
          <label className="block text-fit-xs font-semibold text-gray-700 mb-2">
            Recherche dans CSV
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Montant, date, description..."
              className="w-full pl-10 pr-3 py-2 text-fit-xs border border-cyan-100/80 rounded-lg bg-white/80 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
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
        <div className="glass-panel rounded-xl border border-cyan-100/70 overflow-hidden budget-container">
          <div className="flex flex-col gap-3 p-3 sm:p-4 border-b border-cyan-100/70">
            {/* Onglets */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 bg-white/80 rounded-full p-1 border border-cyan-100/70">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-full text-fit-xs font-semibold transition-all ${
                    activeTab === 'all'
                      ? 'bg-white text-cyan-700 shadow-sm'
                      : 'text-gray-600 hover:text-cyan-700'
                  }`}
                >
                  🎯 Tout ({stats.totalInvoices + stats.totalPayments})
                </button>
                <button
                  onClick={() => setActiveTab('matched')}
                  className={`px-3 py-1.5 rounded-full text-fit-xs font-semibold transition-all ${
                    activeTab === 'matched'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  ✅ Lettrés ({stats.matchedInvoices})
                </button>
                <button
                  onClick={() => setActiveTab('unmatched')}
                  className={`px-3 py-1.5 rounded-full text-fit-xs font-semibold transition-all ${
                    activeTab === 'unmatched'
                      ? 'bg-white text-amber-600 shadow-sm'
                      : 'text-gray-600 hover:text-amber-600'
                  }`}
                >
                  ⏳ Non lettrés ({stats.unmatchedInvoices + stats.unmatchedPayments})
                </button>
              </div>

              {/* Mode d'affichage */}
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {lettrage.matches.length > 0 && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 neon-cta-outline text-fit-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Aperçu
                  </button>
                )}
                
                <button
                  onClick={() => setIsCanvasMode(!isCanvasMode)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-fit-xs font-semibold transition-all ${
                    isCanvasMode
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-white/80 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🎨 Mode Canvas
                </button>

                {lettrage.matches.length > 0 && (
                  <button
                    onClick={handleValidateAll}
                    disabled={lettrage.isLoading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 neon-cta text-fit-xs disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Valider Tout
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contenu selon le mode */}
          <div className="p-3 sm:p-4">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Liste des factures */}
                <div>
                  <h3 className="text-fit-md font-semibold text-gray-900 mb-3">
                    📄 Factures ({filteredData.invoices.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {filteredData.invoices.map(invoice => {
                      const isMatched = lettrage.matches.some(m => m.invoiceId === invoice.id);
                      return (
                        <div
                          key={invoice.id}
                          className={`p-3 rounded-lg border transition-all cursor-pointer budget-container ${
                            isMatched
                              ? 'border-green-200/80 bg-green-50/70 hover:border-green-300'
                              : 'border-cyan-100/70 bg-white/80 hover:border-cyan-300'
                          }`}
                          onClick={() => handleInvoiceClick(invoice)}
                          title="Cliquer pour voir les détails"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-fit-sm font-semibold text-gray-900 flex items-center gap-2 truncate">
                                {invoice.name}
                                <span className="text-fit-xs text-blue-600">🔍</span>
                              </p>
                              <p className="text-fit-xs text-gray-600">
                                {new Date(invoice.document_date || '').toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-fit-sm font-bold text-gray-900">
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'EUR'
                                }).format(invoice.amount || 0)}
                              </p>
                              {isMatched && (
                                <span className="inline-flex items-center gap-1 text-green-600 text-fit-xs">
                                  <CheckCircle className="w-3.5 h-3.5" />
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
        <div className="text-center py-10 glass-panel rounded-2xl border border-cyan-100/70">
          <FileSpreadsheet className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
          <h3 className="text-fit-md font-semibold text-gray-900 mb-2">
            Commencez par importer votre fichier CSV
          </h3>
          <p className="text-fit-sm text-gray-600 mb-4">
            Le fichier doit contenir les colonnes "date" et "montant"
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 neon-cta text-fit-xs"
          >
            <Upload className="w-4 h-4" />
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
