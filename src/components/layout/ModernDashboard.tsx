import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Receipt,
  Eye,
  Plus,
  Menu
} from 'lucide-react';
import Button from '@/components/ui/Button';
import EnhancedFileGrid from '@/components/files/EnhancedFileGrid';
import SubmittedInvoicesList from '@/components/invoices/SubmittedInvoicesList';
import FileUploader from '@/components/files/FileUploader';
import CompactUploader from '@/components/files/CompactUploader';
import YearlyNavigation from './YearlyNavigation';
import { useFiles } from '@/hooks/useFiles';
import { useSubmittedInvoices } from '@/hooks/useSubmittedInvoices';
import { deleteFile } from '@/lib/services/fileService';
import { updateFileMetadata, updateFileWithBadges } from '@/lib/services/fileUpdateService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import type { FileItem } from '@/types/file';

type ContentType = 'files' | 'overview';

interface QuickStats {
  totalFiles: number;
  totalInvoices: number;
  totalAmount: number;
}

export default function ModernDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('overview');

  const [selectedPeriod, setSelectedPeriod] = useState<{year: string | null, month: string | null}>({
    year: null,
    month: null
  });
  const [accordionExpanded, setAccordionExpanded] = useState(false);
  
  const toast = useToast();
  const { user } = useAuth();
  
  // Fonction pour gérer la sélection de période avec basculement automatique vers factures en mobile
  const handlePeriodSelect = (period: { year: string; month: string }) => {
    setSelectedPeriod(period);
    
    // En mobile (< lg), basculer automatiquement vers les factures
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    if (isMobile && period.year && period.month) {
      setContentType('files');
    }
  };

  // Data hooks
  const { files, loading: loadingFiles, error: errorFiles, refetch: refetchFiles } = useFiles(
    selectedPeriod.year && selectedPeriod.month ? selectedPeriod : {}
  );
  
  const { invoices, loading: loadingInvoices, updateInvoice } = useSubmittedInvoices(
    selectedPeriod.year && selectedPeriod.month ? selectedPeriod : {}
  );

  // Compute stats
  const stats: QuickStats = useMemo(() => {
    const totalFiles = files?.length || 0;
    const totalInvoices = invoices?.length || 0;
    // Calculer le montant total à partir des fichiers (factures) ET des invoices soumises
    const filesAmount = files?.reduce((sum, file) => sum + (file.amount || 0), 0) || 0;
    const invoicesAmount = invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
    const totalAmount = filesAmount + invoicesAmount;

    return { totalFiles, totalInvoices, totalAmount };
  }, [files, invoices]);

  // Organize data by periods
  const periodsData = useMemo(() => {
    const periods = new Map<string, {
      year: string;
      month: string;
      files: FileItem[];
      invoices: any[];
      monthName: string;
    }>();

    // Process files
    files?.forEach(file => {
      const key = `${file.year}-${file.month}`;
      if (!periods.has(key)) {
        const date = new Date(parseInt(file.year), parseInt(file.month) - 1);
        periods.set(key, {
          year: file.year,
          month: file.month,
          files: [],
          invoices: [],
          monthName: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        });
      }
      periods.get(key)?.files.push(file);
    });

    // Process invoices
    invoices?.forEach(invoice => {
      const key = `${invoice.year}-${invoice.month}`;
      if (!periods.has(key)) {
        const date = new Date(parseInt(invoice.year), parseInt(invoice.month) - 1);
        periods.set(key, {
          year: invoice.year,
          month: invoice.month,
          files: [],
          invoices: [],
          monthName: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        });
      }
      periods.get(key)?.invoices.push(invoice);
    });

    return Array.from(periods.values()).sort((a, b) => {
      if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
      return parseInt(b.month) - parseInt(a.month);
    });
  }, [files, invoices]);

  const handleFileUpdate = async (fileId: string, updates: Partial<FileItem>) => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return;
    }

    try {
      console.log('🔄 ModernDashboard - handleFileUpdate:', fileId, updates);
      
      // Vérifier si nous avons des badges à gérer
      if (updates.badge_ids !== undefined || updates.budget_id !== undefined) {
        console.log('🏷️ Mise à jour avec badges/budget - utilisation de updateFileWithBadges');
        await updateFileWithBadges(fileId, updates, user.id);
      } else {
        console.log('📝 Mise à jour simple - utilisation de updateFileMetadata');
        await updateFileMetadata(fileId, updates);
      }
      
      toast.success('Facture mise à jour avec succès');
      await refetchFiles();
    } catch (error) {
      console.error('❌ Error updating file:', error);
      toast.error('Erreur lors de la mise à jour de la facture');
    }
  };

  const handleFileDelete = async (file: FileItem) => {
    try {
      await deleteFile(file);
      toast.success('Facture supprimée avec succès');
      await refetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erreur lors de la suppression de la facture');
    }
  };

  const filteredCurrentFiles = useMemo(() => {
    if (!selectedPeriod.year || !selectedPeriod.month) return [];
    return files?.filter(f => f.year === selectedPeriod.year && f.month === selectedPeriod.month) || [];
  }, [files, selectedPeriod]);

  // Génération des 12 derniers mois pour l'accordéon
  const last12Months = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      // Trouver les données pour cette période
      const periodData = periodsData.find(p => p.year === year && p.month === month);
      
      months.push({
        year,
        month,
        monthName,
        files: periodData?.files || [],
        invoices: periodData?.invoices || [],
        filesCount: periodData?.files.length || 0,
        totalAmount: (periodData?.files.reduce((sum, file) => sum + (file.amount || 0), 0) || 0) +
                     (periodData?.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0)
      });
    }
    
    return months;
  }, [periodsData]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Collapsible Sidebar */}
        <motion.aside
          initial={{ width: 280 }}
          animate={{ width: sidebarCollapsed ? 64 : 280 }}
          className={`bg-white shadow-lg border-r border-gray-200 flex flex-col ${
            mobileMenuOpen 
              ? 'fixed inset-y-0 left-0 z-50 w-80 lg:relative lg:w-auto' 
              : 'hidden lg:flex'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <h2 className="font-semibold text-gray-900">Navigation</h2>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hover:bg-gray-100"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-200">
            {!sidebarCollapsed ? (
              <div className="space-y-2">
                <div className="hidden lg:block">
                  <FileUploader 
                    folderId={null} 
                    onSuccess={refetchFiles}
                  />
                </div>
                <div className="lg:hidden">
                  <CompactUploader onSuccess={refetchFiles} />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContentType('overview')}
                  className="w-full justify-start"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Vue d'ensemble
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Button variant="ghost" size="sm" className="w-10 h-10 p-0" title="Importer">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setContentType('overview')}
                  className="w-10 h-10 p-0"
                  title="Vue d'ensemble"
                >
                  <Home className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Periods Navigation */}
          <div className="flex-1 overflow-y-auto p-2">
            {!sidebarCollapsed ? (
              <YearlyNavigation 
                periodsData={periodsData} 
                selectedPeriod={selectedPeriod}
                onPeriodSelect={handlePeriodSelect}
              />
            ) : (
              <div className="space-y-2">
                {periodsData.map((period) => (
                  <motion.div
                    key={`${period.year}-${period.month}`}
                    whileHover={{ scale: 1.02 }}
                    className={`p-2 rounded-lg cursor-pointer transition-all ${
                      selectedPeriod.year === period.year && selectedPeriod.month === period.month
                        ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => handlePeriodSelect({ year: period.year, month: period.month })}
                  >
                    <div className="flex flex-col items-center">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-xs mt-1">{period.month}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation Bar */}
          <header className="bg-white shadow-sm border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-cyan-600 hover:bg-gray-50"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Breadcrumb + Title */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Home className="h-4 w-4" />
                  {selectedPeriod.year && selectedPeriod.month && (
                    <>
                      <span>/</span>
                      <span className="font-medium">
                        {periodsData.find(p => p.year === selectedPeriod.year && p.month === selectedPeriod.month)?.monthName}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Content Type Tabs - Only Factures */}
                <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setContentType('files')}
                    className="px-3 py-1 rounded-md text-sm font-medium bg-white text-gray-900 shadow-sm"
                  >
                    Factures ({filteredCurrentFiles.length})
                  </button>
                </div>

                {/* Mobile Content Type - Only Factures */}
                <div className="sm:hidden">
                  <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-900">
                    Factures ({filteredCurrentFiles.length})
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-3 md:p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {contentType === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 md:space-y-6"
                >
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
                    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Factures</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-blue-50 rounded-lg">
                          <Receipt className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Montant Total</p>
                          <p className="text-xl md:text-2xl font-bold text-gray-900">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR'
                            }).format(stats.totalAmount)}
                          </p>
                        </div>
                        <div className="p-2 md:p-3 bg-green-50 rounded-lg">
                          <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aperçu par période - Accordéon 12 derniers mois */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {/* Header avec bouton accordéon */}
                    <div 
                      className="p-4 md:p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setAccordionExpanded(!accordionExpanded)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Aperçu par période (12 derniers mois)
                        </h3>
                        <motion.div
                          animate={{ rotate: accordionExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Contenu accordéon */}
                    <AnimatePresence>
                      {accordionExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 md:p-6 space-y-3 md:space-y-4 max-h-96 overflow-y-auto">
                            {last12Months.map((month) => (
                              <motion.div
                                key={`${month.year}-${month.month}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer transition-all ${
                                  selectedPeriod.year === month.year && selectedPeriod.month === month.month
                                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 shadow-sm'
                                    : month.filesCount > 0
                                      ? 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                                      : 'bg-gray-25 border border-transparent opacity-60'
                                }`}
                                onClick={() => {
                                  if (month.filesCount > 0) {
                                    handlePeriodSelect({ year: month.year, month: month.month });
                                    // Pour desktop, basculer vers les factures explicitement
                                    const isMobile = window.innerWidth < 1024;
                                    if (!isMobile) {
                                      setContentType('files');
                                    }
                                  }
                                }}
                              >
                                <div className="flex items-center space-x-3 md:space-x-4">
                                  <Calendar className={`h-4 w-4 md:h-5 md:w-5 ${
                                    month.filesCount > 0 ? 'text-gray-400' : 'text-gray-300'
                                  }`} />
                                  <span className={`font-medium text-sm md:text-base ${
                                    month.filesCount > 0 ? 'text-gray-900' : 'text-gray-400'
                                  }`}>
                                    {month.monthName}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-3 md:space-x-6 text-xs md:text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <Receipt className={`h-3 w-3 md:h-4 md:w-4 mr-1 ${
                                      month.filesCount > 0 ? 'text-gray-400' : 'text-gray-300'
                                    }`} />
                                    <span className="hidden sm:inline">
                                      {month.filesCount} facture{month.filesCount > 1 ? 's' : ''}
                                    </span>
                                    <span className="sm:hidden">{month.filesCount}</span>
                                  </span>
                                  {month.totalAmount > 0 && (
                                    <span className="font-medium text-green-600">
                                      {new Intl.NumberFormat('fr-FR', {
                                        style: 'currency',
                                        currency: 'EUR',
                                        minimumFractionDigits: 0,
                                      }).format(month.totalAmount)}
                                    </span>
                                  )}
                                  {month.filesCount > 0 && (
                                    <Eye className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Résumé rapide (toujours visible) */}
                    {!accordionExpanded && (
                      <div className="p-4 md:p-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-xs text-gray-500">Mois avec factures</p>
                            <p className="text-lg font-bold text-blue-600">
                              {last12Months.filter(m => m.filesCount > 0).length}/12
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total factures</p>
                            <p className="text-lg font-bold text-green-600">
                              {last12Months.reduce((sum, m) => sum + m.filesCount, 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {contentType === 'files' && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                                          className="space-y-4 md:space-y-6"
                      >
                        {selectedPeriod.year && selectedPeriod.month ? (
                          <EnhancedFileGrid
                            files={filteredCurrentFiles}
                            onDelete={handleFileDelete}
                            onUpdate={refetchFiles}
                            onUpdateFile={handleFileUpdate}
                          />
                        ) : (
                          <div className="text-center py-8 md:py-12">
                            <Receipt className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Sélectionnez une période</h3>
                            <p className="mt-1 text-sm text-gray-500 px-4">
                              Choisissez une année et un mois dans le menu pour voir les factures.
                            </p>
                          </div>
                        )}
                </motion.div>
              )}


            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}