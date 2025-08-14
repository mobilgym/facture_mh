import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Receipt, Calendar, TrendingUp, ArrowRight } from 'lucide-react';

interface PeriodData {
  year: string;
  month: string;
  files: any[];
  invoices: any[];
  monthName: string;
  totalAmount?: number;
}

interface PeriodCardProps {
  period: PeriodData;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

export default function PeriodCard({ period, isSelected, onClick, compact = false }: PeriodCardProps) {
  const totalAmount = period.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`p-3 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 shadow-sm'
            : 'hover:bg-gray-50 border border-transparent'
        }`}
        onClick={onClick}
      >
        <div className="font-medium text-sm text-gray-900 mb-2">
          {period.monthName}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span className="flex items-center">
            <FileText className="h-3 w-3 mr-1" />
            {period.files.length}
          </span>
          <span className="flex items-center">
            <Receipt className="h-3 w-3 mr-1" />
            {period.invoices.length}
          </span>
        </div>
        {totalAmount > 0 && (
          <div className="mt-2 text-xs font-medium text-cyan-700">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(totalAmount)}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`p-6 bg-white rounded-xl shadow-sm border cursor-pointer transition-all ${
        isSelected
          ? 'border-cyan-200 shadow-md ring-2 ring-cyan-100'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">{period.monthName}</h3>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg mx-auto mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">{period.files.length}</div>
          <div className="text-xs text-gray-500">Facture{period.files.length > 1 ? 's' : ''}</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-lg mx-auto mb-2">
            <Receipt className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">{period.invoices.length}</div>
          <div className="text-xs text-gray-500">Facture{period.invoices.length > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Total Amount */}
      {totalAmount > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <div className="font-bold text-purple-700">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(totalAmount)}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}