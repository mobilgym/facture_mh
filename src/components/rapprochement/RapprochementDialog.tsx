import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Check,
  XCircle,
  Link2,
  Unlink,
  Plus,
  Loader2,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Search,
  Eye,
  RotateCcw,
  CheckSquare,
  Square,
  History
} from 'lucide-react';
import { useRapprochement } from '../../hooks/useRapprochement';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import DocumentPreviewModal from '../files/DocumentPreviewModal';
import type { PreviewDocument } from '../files/DocumentPreviewModal';
import type { RapprochementMatch, BankTransaction } from '../../types/rapprochement';
import type { FileItem } from '../../types/file';

interface RapprochementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  year: string;
  month: string;
  monthName: string;
  onInvoiceAdded?: () => void;
}

export default function RapprochementDialog({
  isOpen,
  onClose,
  year,
  month,
  monthName,
  onInvoiceAdded
}: RapprochementDialogProps) {
  const { selectedCompany } = useCompany();
  const { user } = useAuth();
  const rapprochement = useRapprochement(selectedCompany?.id || '');
  const [addingTxId, setAddingTxId] = useState<string | null>(null);
  const [recheckingTxId, setRecheckingTxId] = useState<string | null>(null);
  const [checkedSaved, setCheckedSaved] = useState(false);
  const [wantsNewAnalysis, setWantsNewAnalysis] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [manualMatchMode, setManualMatchMode] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'matches' | 'unmatched-tx' | 'unmatched-inv' | null>('matches');
  const [previewDoc, setPreviewDoc] = useState<PreviewDocument | null>(null);

  useEffect(() => {
    if (isOpen && !checkedSaved) {
      rapprochement.checkForSavedData(year, month);
      setCheckedSaved(true);
    }
    if (!isOpen && checkedSaved) {
      setCheckedSaved(false);
      setWantsNewAnalysis(false);
      setSelectedTxIds(new Set());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, year, month, checkedSaved]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.includes('pdf')) return;
    await rapprochement.importBankStatement(file, year, month);
  }, [rapprochement, year, month]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFileSelect]);

  const handleManualLink = useCallback(() => {
    if (selectedTransaction && selectedInvoice) {
      rapprochement.addManualMatch(selectedInvoice, selectedTransaction);
      setSelectedTransaction(null);
      setSelectedInvoice(null);
      setManualMatchMode(false);
    }
  }, [selectedTransaction, selectedInvoice, rapprochement]);

  const toggleTxSelection = useCallback((txId: string) => {
    setSelectedTxIds(prev => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return next;
    });
  }, []);

  const toggleAllTx = useCallback(() => {
    const { unmatchedTransactions } = rapprochement;
    if (selectedTxIds.size === unmatchedTransactions.length) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(unmatchedTransactions.map(t => t.id)));
    }
  }, [rapprochement, selectedTxIds]);

  const handleClose = () => {
    rapprochement.reset();
    setManualMatchMode(false);
    setSelectedTransaction(null);
    setSelectedInvoice(null);
    setSelectedTxIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  const { step, isParsing, isLoading, stats, matches, unmatchedTransactions, unmatchedInvoices, pdfFileName, pdfUrl, hasSavedData, savedRecord } = rapprochement;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Rapprochement bancaire
              </h2>
              <p className="text-sm text-gray-500 mt-0.5 capitalize">{monthName}</p>
            </div>
            <div className="flex items-center gap-2">
              {pdfUrl && (step === 'results' || step === 'validated') && (
                <button
                  onClick={() => setPreviewDoc({ name: pdfFileName || 'Relevé bancaire', url: pdfUrl, type: 'application/pdf' })}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                  title="Voir le relevé bancaire"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Voir le relevé
                </button>
              )}
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Upload or Load saved */}
            {step === 'upload' && (
              <div className="space-y-6">
                {hasSavedData && savedRecord && !wantsNewAnalysis && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Rapprochement existant</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Un relev&eacute; a d&eacute;j&agrave; &eacute;t&eacute; analys&eacute; pour {monthName}.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                            <p className="text-gray-500 text-xs">Fichier</p>
                            <p className="font-medium text-gray-900 truncate">{savedRecord.pdfFileName}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                            <p className="text-gray-500 text-xs">Transactions</p>
                            <p className="font-medium text-gray-900">{savedRecord.transactions.length}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => rapprochement.loadSavedData(year, month)}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Charger le rapprochement
                          </button>
                          <button
                            onClick={() => setWantsNewAnalysis(true)}
                            className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Nouvelle analyse IA
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(!hasSavedData || wantsNewAnalysis) && (
                  <>
                    <div className="text-center space-y-2">
                      {wantsNewAnalysis && (
                        <button
                          onClick={() => setWantsNewAnalysis(false)}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto mb-2"
                        >
                          <ArrowRight className="h-3 w-3 rotate-180" />
                          Retour aux donn&eacute;es existantes
                        </button>
                      )}
                      <h3 className="text-lg font-medium text-gray-900">
                        {wantsNewAnalysis ? 'Nouvelle analyse du relev\u00e9' : 'Importez votre relev\u00e9 bancaire'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {wantsNewAnalysis
                          ? 'Importez un nouveau relev\u00e9 pour remplacer l\'analyse pr\u00e9c\u00e9dente.'
                          : `Glissez-d\u00e9posez ou s\u00e9lectionnez un relev\u00e9 bancaire PDF. L'IA analysera les transactions et les comparera aux factures de ${monthName}.`
                        }
                      </p>
                    </div>
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                        dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <Upload className={`h-12 w-12 mx-auto mb-4 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                      <p className="text-base font-medium text-gray-700">
                        {dragOver ? 'D\u00e9posez le fichier ici' : 'Cliquez ou glissez votre relev\u00e9 bancaire PDF'}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">Format accept\u00e9 : PDF</p>
                      <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleInputChange} className="hidden" />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Parsing */}
            {step === 'parsing' && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900">Analyse en cours...</h3>
                <p className="text-sm text-gray-500">
                  Extraction des transactions de <span className="font-medium">{pdfFileName}</span>
                </p>
                <div className="flex flex-col items-center space-y-2 text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Conversion des pages PDF en images...</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Analyse visuelle par GPT-4o Vision</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Results */}
            {(step === 'results' || step === 'validated') && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Transactions" value={stats.totalTransactions} color="blue" />
                  <StatCard label="Factures" value={stats.totalInvoices} color="purple" />
                  <StatCard label="Rapproch\u00e9es" value={stats.matchedCount} color="green" />
                  <StatCard
                    label="Taux"
                    value={`${stats.matchingRate.toFixed(0)}%`}
                    color={stats.matchingRate === 100 ? 'green' : stats.matchingRate >= 50 ? 'yellow' : 'red'}
                  />
                </div>

                {/* Amounts */}
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total transactions</span>
                    <p className="font-semibold text-gray-900">{formatCurrency(stats.totalTransactionAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total factures</span>
                    <p className="font-semibold text-gray-900">{formatCurrency(stats.totalInvoiceAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Montant rapproch&eacute;</span>
                    <p className="font-semibold text-green-600">{formatCurrency(stats.matchedAmount)}</p>
                  </div>
                </div>

                {step === 'validated' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">Rapprochement valid&eacute;</p>
                      <p className="text-sm text-green-600">
                        {stats.matchedCount} correspondance{stats.matchedCount > 1 ? 's' : ''} valid&eacute;e{stats.matchedCount > 1 ? 's' : ''} et sauvegard&eacute;e{stats.matchedCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Matches */}
                {matches.length > 0 && (
                  <CollapsibleSection
                    title={`Correspondances (${matches.length})`}
                    icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                    isExpanded={expandedSection === 'matches'}
                    onToggle={() => setExpandedSection(expandedSection === 'matches' ? null : 'matches')}
                    badge={`${matches.filter(m => m.isValidated).length}/${matches.length} valid\u00e9es`}
                    badgeColor="green"
                  >
                    <div className="space-y-2">
                      {matches.map(match => (
                        <MatchRow
                          key={match.id}
                          match={match}
                          onValidate={() => rapprochement.validateMatch(match.id, year, month)}
                          onRemove={() => rapprochement.removeMatch(match.id)}
                          onPreview={() => {
                            if (match.invoiceUrl) {
                              setPreviewDoc({
                                name: match.invoiceName || 'Facture',
                                url: match.invoiceUrl,
                                type: match.invoiceType
                              });
                            }
                          }}
                          isValidatedStep={step === 'validated'}
                        />
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Unmatched Transactions */}
                {unmatchedTransactions.length > 0 && (
                  <CollapsibleSection
                    title={`Transactions non rapproch\u00e9es (${unmatchedTransactions.length})`}
                    icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                    isExpanded={expandedSection === 'unmatched-tx'}
                    onToggle={() => setExpandedSection(expandedSection === 'unmatched-tx' ? null : 'unmatched-tx')}
                    badge={formatCurrency(unmatchedTransactions.reduce((sum, t) => sum + t.amount, 0))}
                    badgeColor="amber"
                    headerAction={
                      (step === 'results' || step === 'validated') ? (
                        <div className="flex items-center gap-1.5">
                          {selectedTxIds.size > 0 && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rapprochement.recheckTransactions(
                                    unmatchedTransactions.filter(t => selectedTxIds.has(t.id)),
                                    year, month
                                  );
                                  setSelectedTxIds(new Set());
                                }}
                                disabled={isLoading}
                                className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Rev&eacute;rifier ({selectedTxIds.size})
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rapprochement.recheckPreviousMonth(
                                    unmatchedTransactions.filter(t => selectedTxIds.has(t.id)),
                                    year, month
                                  );
                                  setSelectedTxIds(new Set());
                                }}
                                disabled={isLoading}
                                className="px-2.5 py-1 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 transition-colors flex items-center gap-1"
                              >
                                <History className="h-3 w-3" />
                                Mois pr&eacute;c&eacute;dent ({selectedTxIds.size})
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              rapprochement.createAllUnmatchedInvoices(year, month);
                              onInvoiceAdded?.();
                            }}
                            disabled={isLoading}
                            className="px-2.5 py-1 bg-amber-600 text-white rounded-md text-xs font-medium hover:bg-amber-700 transition-colors flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Tout ajouter
                          </button>
                        </div>
                      ) : undefined
                    }
                  >
                    {/* Select all bar */}
                    {(step === 'results' || step === 'validated') && unmatchedTransactions.length > 1 && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                        <button
                          onClick={toggleAllTx}
                          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          {selectedTxIds.size === unmatchedTransactions.length
                            ? <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                            : <Square className="h-3.5 w-3.5" />
                          }
                          {selectedTxIds.size === unmatchedTransactions.length ? 'Tout d\u00e9s\u00e9lectionner' : 'Tout s\u00e9lectionner'}
                        </button>
                        {selectedTxIds.size > 0 && (
                          <span className="text-xs text-blue-600 font-medium">
                            {selectedTxIds.size} s\u00e9lectionn\u00e9e{selectedTxIds.size > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      {unmatchedTransactions.map(tx => (
                        <div
                          key={tx.id}
                          onClick={() => {
                            if (manualMatchMode) {
                              setSelectedTransaction(tx.id === selectedTransaction ? null : tx.id);
                            } else if (step === 'results' || step === 'validated') {
                              toggleTxSelection(tx.id);
                            }
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                            selectedTransaction === tx.id
                              ? 'border-blue-400 bg-blue-50'
                              : selectedTxIds.has(tx.id)
                                ? 'border-blue-300 bg-blue-50/50'
                                : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {(step === 'results' || step === 'validated') && !manualMatchMode && (
                              <div className="flex-shrink-0">
                                {selectedTxIds.has(tx.id)
                                  ? <CheckSquare className="h-4 w-4 text-blue-600" />
                                  : <Square className="h-4 w-4 text-gray-300" />
                                }
                              </div>
                            )}
                            <div className={`p-1.5 rounded-md ${tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                              <ArrowRight className={`h-3.5 w-3.5 ${tx.type === 'credit' ? 'text-green-600 rotate-180' : 'text-red-600'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold mr-1.5 ${
                                  tx.type === 'debit' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {tx.type === 'debit' ? 'ACH' : 'VTE'}
                                </span>
                                {tx.description}
                              </p>
                              <p className="text-xs text-gray-500">{tx.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold text-sm tabular-nums ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'debit' ? '-' : '+'}{formatCurrency(tx.amount)}
                            </span>
                            {(step === 'results' || step === 'validated') && (
                              <>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setRecheckingTxId(tx.id);
                                    try {
                                      await rapprochement.recheckTransactions([tx], year, month);
                                    } finally {
                                      setRecheckingTxId(null);
                                    }
                                  }}
                                  disabled={recheckingTxId === tx.id}
                                  className="p-1.5 hover:bg-blue-100 rounded-md transition-colors"
                                  title="Rev\u00e9rifier ce montant"
                                >
                                  {recheckingTxId === tx.id
                                    ? <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                                    : <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                                  }
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setAddingTxId(tx.id);
                                    try {
                                      await rapprochement.createInvoiceFromTransaction(tx, year, month);
                                      onInvoiceAdded?.();
                                      await rapprochement.rerunMatching(year, month);
                                    } finally {
                                      setAddingTxId(null);
                                    }
                                  }}
                                  disabled={addingTxId === tx.id}
                                  className="p-1.5 hover:bg-amber-100 rounded-md transition-colors"
                                  title={`Ajouter comme facture ${tx.type === 'debit' ? 'ACH' : 'VTE'}`}
                                >
                                  {addingTxId === tx.id
                                    ? <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin" />
                                    : <Plus className="h-3.5 w-3.5 text-amber-600" />
                                  }
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Unmatched Invoices */}
                {unmatchedInvoices.length > 0 && (
                  <CollapsibleSection
                    title={`Factures sans correspondance (${unmatchedInvoices.length})`}
                    icon={<XCircle className="h-4 w-4 text-red-500" />}
                    isExpanded={expandedSection === 'unmatched-inv'}
                    onToggle={() => setExpandedSection(expandedSection === 'unmatched-inv' ? null : 'unmatched-inv')}
                    badge={formatCurrency(unmatchedInvoices.reduce((sum: number, inv: FileItem) => sum + (inv.amount || 0), 0))}
                    badgeColor="red"
                  >
                    <div className="space-y-2">
                      {unmatchedInvoices.map((inv: FileItem) => (
                        <div
                          key={inv.id}
                          onClick={() => {
                            if (manualMatchMode) setSelectedInvoice(inv.id === selectedInvoice ? null : inv.id);
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            selectedInvoice === inv.id
                              ? 'border-blue-400 bg-blue-50'
                              : manualMatchMode
                                ? 'border-gray-200 hover:border-blue-300 cursor-pointer'
                                : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-gray-100">
                              <FileText className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                              <p className="text-xs text-gray-500">{inv.document_date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900 tabular-nums">
                              {formatCurrency(inv.amount || 0)}
                            </span>
                            {inv.url && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewDoc({ name: inv.name, url: inv.url, type: inv.type });
                                }}
                                className="p-1.5 hover:bg-blue-100 rounded-md transition-colors"
                                title="Voir la facture"
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Manual Match Floating Bar */}
                {manualMatchMode && (selectedTransaction || selectedInvoice) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-xl px-6 py-3 border border-blue-200 flex items-center gap-4 z-[60]"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-1 rounded ${selectedTransaction ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                        {selectedTransaction ? '1 transaction' : 'Transaction ?'}
                      </span>
                      <Link2 className="h-4 w-4 text-gray-400" />
                      <span className={`px-2 py-1 rounded ${selectedInvoice ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                        {selectedInvoice ? '1 facture' : 'Facture ?'}
                      </span>
                    </div>
                    <button
                      onClick={handleManualLink}
                      disabled={!selectedTransaction || !selectedInvoice}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    >
                      Lier
                    </button>
                    <button
                      onClick={() => { setManualMatchMode(false); setSelectedTransaction(null); setSelectedInvoice(null); }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(step === 'results' || step === 'validated') && (
                <>
                  <button
                    onClick={() => { setManualMatchMode(!manualMatchMode); setSelectedTransaction(null); setSelectedInvoice(null); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      manualMatchMode
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Link2 className="h-4 w-4" />
                    Lien manuel
                  </button>
                  <button
                    onClick={() => rapprochement.rerunMatching(year, month)}
                    disabled={isLoading}
                    className="px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Relancer
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
                {step === 'validated' ? 'Fermer' : 'Annuler'}
              </button>
              {step === 'results' && matches.length > 0 && (
                <button
                  onClick={() => rapprochement.validateAll(year, month)}
                  disabled={isLoading}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Valider le rapprochement
                </button>
              )}
              {step === 'validated' && (
                <>
                  <button
                    onClick={() => { rapprochement.reset(); setWantsNewAnalysis(true); }}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    R&eacute;-analyser (IA)
                  </button>
                  <button
                    onClick={() => rapprochement.reset()}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Nouveau rapprochement
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <DocumentPreviewModal previewDocument={previewDoc} isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} />
    </AnimatePresence>
  );
}

// ---- Sub-components ----

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color] || colorMap.blue}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-75 mt-0.5">{label}</p>
    </div>
  );
}

function CollapsibleSection({ title, icon, children, isExpanded, onToggle, badge, badgeColor, headerAction }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; isExpanded: boolean;
  onToggle: () => void; badge?: string; badgeColor?: string; headerAction?: React.ReactNode;
}) {
  const badgeColorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700'
  };
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm text-gray-900">{title}</span>
          {badge && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColorMap[badgeColor || 'blue']}`}>{badge}</span>}
        </div>
        <div className="flex items-center gap-2">
          {headerAction}
          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="p-4 max-h-80 overflow-y-auto">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchRow({ match, onValidate, onRemove, onPreview, isValidatedStep }: {
  match: RapprochementMatch; onValidate: () => void; onRemove: () => void;
  onPreview: () => void; isValidatedStep: boolean;
}) {
  const isExact = match.confidence === 'exact';
  const confidenceConfig: Record<string, { bg: string; label: string }> = {
    exact: { bg: 'bg-green-100 text-green-700', label: 'Exact' },
    close: { bg: 'bg-amber-100 text-amber-700', label: 'Approch\u00e9' },
    manual: { bg: 'bg-blue-100 text-blue-700', label: 'Manuel' }
  };
  const conf = confidenceConfig[match.confidence] || confidenceConfig.manual;

  return (
    <div className={`p-3 rounded-lg border transition-all ${
      match.isValidated ? 'border-green-200 bg-green-50/50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Top: badge + amount highlight + actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${conf.bg}`}>{conf.label}</span>
          {match.isValidated && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
        </div>
        <div className="flex items-center gap-1">
          {match.invoiceUrl && (
            <button onClick={onPreview} className="p-1.5 hover:bg-blue-100 rounded-md transition-colors" title="Voir la facture">
              <Eye className="h-4 w-4 text-blue-600" />
            </button>
          )}
          {!isValidatedStep && (
            <>
              {!match.isValidated && (
                <button onClick={onValidate} className="p-1.5 hover:bg-green-100 rounded-md transition-colors" title="Valider">
                  <Check className="h-4 w-4 text-green-600" />
                </button>
              )}
              <button onClick={onRemove} className="p-1.5 hover:bg-red-100 rounded-md transition-colors" title="Supprimer">
                <Unlink className="h-4 w-4 text-red-500" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Amount highlight bar */}
      <div className={`rounded-lg px-3 py-2 mb-2 flex items-center justify-center gap-3 ${
        isExact ? 'bg-green-100' : 'bg-amber-50'
      }`}>
        <span className="text-lg font-bold tabular-nums text-gray-900">{formatCurrency(match.transactionAmount)}</span>
        {match.difference < 0.01 ? (
          <span className="text-xs font-medium text-green-700 bg-green-200 px-1.5 py-0.5 rounded">= correspondance exacte</span>
        ) : (
          <span className="text-xs font-medium text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded">
            \u0394 {formatCurrency(match.difference)}
          </span>
        )}
      </div>

      {/* Transaction ↔ Facture */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 min-w-0 bg-gray-50 rounded-md p-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Transaction</p>
          <p className="font-medium text-gray-900 truncate text-xs mt-0.5">{match.transactionDescription}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{match.transactionDate}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
        <div className="flex-1 min-w-0 bg-gray-50 rounded-md p-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Facture</p>
          <p className="font-medium text-gray-900 truncate text-xs mt-0.5">{match.invoiceName}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{match.invoiceDate}</p>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount);
}
