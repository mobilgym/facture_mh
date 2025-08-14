import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Calendar, Receipt, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PeriodData {
  year: string;
  month: string;
  files: any[];
  invoices: any[];
  monthName: string;
}

interface YearlyNavigationProps {
  periodsData: PeriodData[];
  selectedPeriod: { year: string | null; month: string | null };
  onPeriodSelect: (period: { year: string; month: string }) => void;
}

interface YearGroup {
  year: string;
  periods: PeriodData[];
  totalFiles: number;
  totalInvoices: number;
  totalAmount: number;
}

export default function YearlyNavigation({ periodsData, selectedPeriod, onPeriodSelect }: YearlyNavigationProps) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  // Grouper les données par année
  const yearGroups: YearGroup[] = useMemo(() => {
    const groups = new Map<string, YearGroup>();

    periodsData.forEach(period => {
      if (!groups.has(period.year)) {
        groups.set(period.year, {
          year: period.year,
          periods: [],
          totalFiles: 0,
          totalInvoices: 0,
          totalAmount: 0
        });
      }

      const group = groups.get(period.year)!;
      group.periods.push(period);
      group.totalFiles += period.files.length;
      group.totalInvoices += period.invoices.length;
      
      // Calculer le montant total
      const periodAmount = period.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      group.totalAmount += periodAmount;
    });

    // Trier les mois par ordre décroissant dans chaque année
    groups.forEach(group => {
      group.periods.sort((a, b) => parseInt(b.month) - parseInt(a.month));
    });

    return Array.from(groups.values()).sort((a, b) => parseInt(b.year) - parseInt(a.year));
  }, [periodsData]);

  // Auto-expand l'année sélectionnée
  React.useEffect(() => {
    if (selectedPeriod.year) {
      setExpandedYears(prev => new Set(prev).add(selectedPeriod.year!));
    }
  }, [selectedPeriod.year]);

  const toggleYear = (year: string) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-2">
      {/* Bouton pour tout afficher */}
      {(selectedPeriod.year || selectedPeriod.month) && (
        <motion.button
          onClick={() => onPeriodSelect({ year: null, month: null })}
          className="w-full flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center flex-1">
            <Calendar className="h-4 w-4 mr-2 text-gray-600" />
            <span className="font-medium text-gray-900">Tout afficher</span>
          </div>
        </motion.button>
      )}
      
      {yearGroups.map((yearGroup) => {
        const isExpanded = expandedYears.has(yearGroup.year);
        const isYearSelected = selectedPeriod.year === yearGroup.year;

        return (
          <div key={yearGroup.year} className="space-y-1">
            {/* En-tête de l'année */}
            <motion.button
              onClick={(e) => {
                // Si on clique sur le titre de l'année, on sélectionne juste l'année (sans mois)
                if (e.detail === 2) { // Double-clic
                  onPeriodSelect({ year: yearGroup.year, month: null });
                } else {
                  toggleYear(yearGroup.year);
                }
              }}
              className={`w-full flex items-center p-3 rounded-lg transition-all ${
                isYearSelected
                  ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              title="Cliquez pour expand/collapse, double-cliquez pour sélectionner l'année"
            >
              <div className="flex items-center flex-1">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2 text-gray-600" />
                )}
                <span className="font-semibold text-gray-900">{yearGroup.year}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span className="flex items-center">
                  <Receipt className="h-3 w-3 mr-1" />
                  {yearGroup.totalFiles}
                </span>
                {yearGroup.totalAmount > 0 && (
                  <span className="flex items-center font-medium text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {formatCurrency(yearGroup.totalAmount)}
                  </span>
                )}
              </div>
            </motion.button>

            {/* Mois de l'année */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-4 space-y-1 overflow-hidden"
                >
                  {yearGroup.periods.map((period) => {
                    const isPeriodSelected = 
                      selectedPeriod.year === period.year && 
                      selectedPeriod.month === period.month;
                    
                    const periodAmount = period.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

                    return (
                      <motion.div
                        key={`${period.year}-${period.month}`}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isPeriodSelected
                            ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 shadow-sm'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={() => {
                          // Si on clique sur le mois déjà sélectionné, on déselectionne
                          if (selectedPeriod.year === period.year && selectedPeriod.month === period.month) {
                            onPeriodSelect({ year: period.year, month: '' });
                          } else {
                            onPeriodSelect({ year: period.year, month: period.month });
                          }
                        }}
                      >
                        {/* En-tête du mois */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-sm text-gray-900">
                              {format(new Date(parseInt(period.year), parseInt(period.month) - 1), 'MMMM', { locale: fr })}
                            </span>
                          </div>
                          {isPeriodSelected && (
                            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                          )}
                        </div>

                        {/* Statistiques du mois */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Receipt className="h-3 w-3 mr-1" />
                            <span>{period.files.length} facture{period.files.length > 1 ? 's' : ''}</span>
                          </div>
                          {periodAmount > 0 && (
                            <div className="flex items-center justify-end font-medium text-green-600">
                              {formatCurrency(periodAmount)}
                            </div>
                          )}
                        </div>

                        {/* Barre de progression relative */}
                        {periodAmount > 0 && yearGroup.totalAmount > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${(periodAmount / yearGroup.totalAmount) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}