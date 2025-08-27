import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  Receipt, 
  Calendar,
  Search,
  Upload,
  Filter
} from 'lucide-react';
import Button from '@/components/ui/Button';
import PeriodCard from './PeriodCard';

interface MobileNavigationProps {
  periodsData: any[];
  selectedPeriod: { year: string | null; month: string | null };
  onPeriodSelect: (year: string, month: string) => void;
  contentType: string;
  onContentTypeChange: (type: 'overview' | 'files') => void;
  onUploadClick?: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function MobileNavigation({
  periodsData,
  selectedPeriod,
  onPeriodSelect,
  contentType,
  onContentTypeChange,
  onUploadClick,
  searchTerm,
  onSearchChange
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">MGHV</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Tabs - Only Factures */}
        <div className="flex mt-3 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onContentTypeChange('files')}
            className="flex-1 py-2 px-3 rounded-md text-sm font-medium bg-white text-gray-900 shadow-sm"
          >
            <Receipt className="h-4 w-4 mx-auto mb-1" />
            Factures
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Navigation</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b border-gray-200 space-y-3">
                <Button
                  onClick={() => {
                    onUploadClick?.();
                    setIsOpen(false);
                  }}
                  className="w-full justify-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Uploader une facture
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    onContentTypeChange('overview');
                    setIsOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Vue d'ensemble
                </Button>
              </div>

              {/* Periods */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Périodes</h3>
                <div className="space-y-3">
                  {periodsData.map((period) => (
                    <div
                      key={`${period.year}-${period.month}`}
                      onClick={() => {
                        onPeriodSelect(period.year, period.month);
                        // Basculer automatiquement vers les factures en mobile
                        onContentTypeChange('files');
                        setIsOpen(false);
                      }}
                    >
                      <PeriodCard
                        period={period}
                        isSelected={
                          selectedPeriod.year === period.year && 
                          selectedPeriod.month === period.month
                        }
                        onClick={() => {
                          onPeriodSelect(period.year, period.month);
                          // Basculer automatiquement vers les factures en mobile
                          onContentTypeChange('files');
                          setIsOpen(false);
                        }}
                        compact
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}