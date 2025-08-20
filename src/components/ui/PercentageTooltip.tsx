import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Calculator, Percent, DollarSign } from 'lucide-react';

interface PercentageTooltipProps {
  totalAmount: number;
  percentage: number;
  retainedAmount: number;
}

export default function PercentageTooltip({ totalAmount, percentage, retainedAmount }: PercentageTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const examples = [
    { percent: 100, desc: "Montant complet", color: "text-green-600" },
    { percent: 75, desc: "3/4 du montant", color: "text-blue-600" },
    { percent: 50, desc: "Moitié du montant", color: "text-orange-600" },
    { percent: 25, desc: "1/4 du montant", color: "text-red-600" }
  ];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
        title="Aide sur le système de pourcentage"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-25 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute top-8 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center space-x-2">
                  <Percent className="h-4 w-4 text-blue-600" />
                  <span>Système de pourcentage</span>
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Explanation */}
              <div className="space-y-3 text-xs text-gray-600">
                <p>
                  Le curseur vous permet de sélectionner quel pourcentage du montant total 
                  vous souhaitez enregistrer pour cette facture.
                </p>

                {/* Current calculation */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Calcul actuel</span>
                  </div>
                  <div className="space-y-1 text-blue-700">
                    <div className="flex justify-between">
                      <span>Montant total:</span>
                      <span className="font-semibold">{totalAmount.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pourcentage:</span>
                      <span className="font-semibold">{percentage}%</span>
                    </div>
                    <div className="border-t border-blue-300 pt-1 flex justify-between font-bold">
                      <span>Montant retenu:</span>
                      <span>{retainedAmount.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span>Exemples avec {totalAmount.toFixed(2)}€</span>
                  </h4>
                  <div className="space-y-1">
                    {examples.map((example) => (
                      <div key={example.percent} className="flex justify-between items-center">
                        <span className={`${example.color} font-medium`}>
                          {example.percent}% - {example.desc}
                        </span>
                        <span className={`${example.color} font-semibold`}>
                          {((totalAmount * example.percent) / 100).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use cases */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-700 mb-2">Cas d'usage</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <strong>100%</strong> : Montant complet de la facture</li>
                    <li>• <strong>80%</strong> : Remise ou réduction appliquée</li>
                    <li>• <strong>50%</strong> : Partage de frais ou acompte</li>
                    <li>• <strong>30%</strong> : Quote-part ou participation</li>
                  </ul>
                </div>

                {/* Tips */}
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-1">💡 Astuce</h4>
                  <p className="text-yellow-700">
                    Utilisez les boutons de présets (25%, 50%, 75%, 100%) 
                    pour une sélection rapide, ou ajustez précisément avec le curseur.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
