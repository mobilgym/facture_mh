import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, 
  Upload, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Calendar, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
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

type ViewMode = 'grid' | 'list';
type ContentType = 'files' | 'overview';
type FilterMode = 'all' | 'recent' | 'date' | 'amount';

interface QuickStats {
  totalFiles: number;
  totalInvoices: number;
  totalAmount: number;
  recentUploads: number;
}

export default function ModernDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<{year: string | null, month: string | null}>({
    year: null,
    month: null
  });
  
  const toast = useToast();
  const { user } = useAuth();
  
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
    
    const recentUploads = files?.filter(f => {
      const uploadDate = new Date(f.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return uploadDate > weekAgo;
    }).length || 0;

    return { totalFiles, totalInvoices, totalAmount, recentUploads };
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
                onPeriodSelect={setSelectedPeriod}
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
                    onClick={() => setSelectedPeriod({ year: period.year, month: period.month })}
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
                
                {/* Content Type Tabs - Hidden on small screens */}
                <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setContentType('overview')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      contentType === 'overview'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Vue d'ensemble
                  </button>
                  <button
                    onClick={() => setContentType('files')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      contentType === 'files'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Factures ({filteredCurrentFiles.length})
                  </button>
                </div>

                {/* Mobile Content Type Selector */}
                <div className="sm:hidden">
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="overview">Vue d'ensemble</option>
                    <option value="files">Factures ({filteredCurrentFiles.length})</option>
                  </select>
                </div>
              </div>

              {/* View Controls */}
              <div className="flex items-center space-x-2 md:space-x-3">
                {/* Search - Responsive */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-32 sm:w-48 md:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* View Mode Toggle - Hidden on small screens */}
                {(contentType === 'files' || contentType === 'overview') && (
                  <div className="hidden sm:flex bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-l-lg ${
                        viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-r-lg ${
                        viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
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

                    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Uploads Récents</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.recentUploads}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-orange-50 rounded-lg">
                          <Upload className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Periods Overview */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-4 md:p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Aperçu par période</h3>
                    </div>
                    <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                      {periodsData.slice(0, 6).map((period) => {
                        // Calculer le montant total pour cette période (files + invoices)
                        const filesAmount = period.files.reduce((sum, file) => sum + (file.amount || 0), 0);
                        const invoicesAmount = period.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
                        const periodAmount = filesAmount + invoicesAmount;
                        return (
                          <div
                            key={`${period.year}-${period.month}`}
                            className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedPeriod({ year: period.year, month: period.month });
                              setContentType('files');
                            }}
                          >
                            <div className="flex items-center space-x-3 md:space-x-4">
                              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                              <span className="font-medium text-gray-900 text-sm md:text-base">{period.monthName}</span>
                            </div>
                            <div className="flex items-center space-x-3 md:space-x-6 text-xs md:text-sm text-gray-500">
                              <span className="flex items-center">
                                <Receipt className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                <span className="hidden sm:inline">{period.files.length} factures</span>
                                <span className="sm:hidden">{period.files.length}</span>
                              </span>
                              {periodAmount > 0 && (
                                <span className="font-medium text-green-600">
                                  {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'EUR',
                                    minimumFractionDigits: 0,
                                  }).format(periodAmount)}
                                </span>
                              )}
                              <Eye className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
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