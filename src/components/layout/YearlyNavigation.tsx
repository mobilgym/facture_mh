import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Calendar, Receipt, TrendingUp, CheckSquare, Square, FileX2 } from 'lucide-react';
import type { RapprochementStatus } from '@/hooks/useRapprochementStatus';
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
  onPeriodSelect: (period: { year: string | null; month: string | null }) => void;
  rapprochementStatus?: Map<string, RapprochementStatus>;
}

interface YearGroup {
  year: string;
  periods: PeriodData[];
  totalFiles: number;
  totalInvoices: number;
  totalAmount: number;
}

export default function YearlyNavigation({ periodsData, selectedPeriod, onPeriodSelect, rapprochementStatus }: YearlyNavigationProps) {
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
          className="w-full flex items-center p-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 border border-gray-200/80 shadow-sm transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center flex-1">
            <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center mr-2.5">
              <Calendar className="h-3.5 w-3.5 text-gray-500" />
            </div>
            <span className="font-medium text-sm text-gray-700">Tout afficher</span>
          </div>
        </motion.button>
      )}

      {yearGroups.map((yearGroup) => {
        const isExpanded = expandedYears.has(yearGroup.year);
        const isYearSelected = selectedPeriod.year === yearGroup.year && !selectedPeriod.month;

        return (
          <div key={yearGroup.year} className="space-y-1">
            {/* En-tete de l'annee */}
            <div className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${
              isYearSelected
                ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200/80 shadow-sm shadow-cyan-100/50'
                : 'hover:bg-gray-50/80 border border-transparent'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPeriodSelect({ year: yearGroup.year, month: null });
                }}
                className="p-1 hover:bg-white/80 rounded-lg transition-colors"
                title="S\u00e9lectionner toute l'ann\u00e9e"
              >
                {isYearSelected ? (
                  <CheckSquare className="h-4 w-4 text-cyan-600" />
                ) : (
                  <Square className="h-4 w-4 text-gray-300" />
                )}
              </button>

              <motion.button
                onClick={() => toggleYear(yearGroup.year)}
                className="flex-1 flex items-center rounded-lg px-2 py-1 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center flex-1">
                  <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-3.5 w-3.5 mr-2 text-gray-400" />
                  </motion.div>
                  <span className="font-bold text-sm text-gray-800">{yearGroup.year}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                    {yearGroup.totalFiles}
                  </span>
                  {yearGroup.totalAmount > 0 && (
                    <span className="text-[10px] font-semibold bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md">
                      {formatCurrency(yearGroup.totalAmount)}
                    </span>
                  )}
                </div>
              </motion.button>
            </div>

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

                    const monthName = (() => {
                      try {
                        const y = parseInt(period.year);
                        const m = parseInt(period.month) - 1;
                        if (isNaN(y) || isNaN(m) || m < 0 || m > 11) return 'Date invalide';
                        return format(new Date(y, m), 'MMMM', { locale: fr });
                      } catch { return 'Date invalide'; }
                    })();

                    const rs = rapprochementStatus?.get(`${period.year}-${period.month}`);

                    return (
                      <motion.div
                        key={`${period.year}-${period.month}`}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                          isPeriodSelected
                            ? 'bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border border-cyan-200/80 shadow-md shadow-cyan-100/40'
                            : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/80 border border-transparent'
                        }`}
                        onClick={() => {
                          if (selectedPeriod.year === period.year && selectedPeriod.month === period.month) {
                            onPeriodSelect({ year: period.year, month: null });
                          } else {
                            onPeriodSelect({ year: period.year, month: period.month });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isPeriodSelected
                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-sm shadow-cyan-200'
                                : 'bg-gray-100'
                            }`}>
                              <Calendar className={`h-3.5 w-3.5 ${isPeriodSelected ? 'text-white' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <span className={`font-medium text-sm capitalize ${isPeriodSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                {monthName}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-400">
                                  {period.files.length} facture{period.files.length > 1 ? 's' : ''}
                                </span>
                                {periodAmount > 0 && (
                                  <span className="text-[10px] font-semibold text-green-600">
                                    {formatCurrency(periodAmount)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {rs && rs.totalTransactions > 0 ? (
                              <span
                                className={`text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                                  rs.matchedCount >= rs.totalTransactions
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-amber-100 text-amber-600'
                                }`}
                                title={`${rs.matchedCount} / ${rs.totalTransactions} transactions`}
                              >
                                {rs.matchedCount}/{rs.totalTransactions}
                              </span>
                            ) : period.files.length > 0 ? (
                              <FileX2 className="h-3 w-3 text-red-300" title="Pas de rapprochement" />
                            ) : null}
                            {isPeriodSelected && (
                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-sm shadow-cyan-300" />
                            )}
                          </div>
                        </div>

                        {periodAmount > 0 && yearGroup.totalAmount > 0 && (
                          <div className="mt-2 ml-9">
                            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(periodAmount / yearGroup.totalAmount) * 100}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className={`h-1 rounded-full ${
                                  isPeriodSelected
                                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                                    : 'bg-gradient-to-r from-gray-300 to-gray-400'
                                }`}
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
