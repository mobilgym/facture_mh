import React, { useState, useEffect } from 'react';
import { Check, X, FileSpreadsheet, ArrowRight, Eye, Upload } from 'lucide-react';

interface CsvColumn {
  index: number;
  name: string;
  sample: string[];
}

interface ColumnMapping {
  dateColumn: number | null;
  amountColumn: number | null;
  descriptionColumn: number | null;
}

interface CsvColumnMapperProps {
  file: File | null;
  onMappingConfirmed: (mapping: ColumnMapping, headers: string[], allRows: string[][]) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function CsvColumnMapper({ file, onMappingConfirmed, onCancel, isOpen }: CsvColumnMapperProps) {
  const [columns, setColumns] = useState<CsvColumn[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateColumn: null,
    amountColumn: null,
    descriptionColumn: null
  });
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [separator, setSeparator] = useState<',' | ';'>(',');

  // Parser le CSV et extraire les colonnes
  useEffect(() => {
    if (!file || !isOpen) return;

    const parseFile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          throw new Error('Le fichier CSV est vide');
        }

        // Détecter le séparateur
        const firstLine = lines[0];
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        const detectedSeparator = semicolonCount > commaCount ? ';' : ',';
        setSeparator(detectedSeparator);

        // Parser toutes les lignes
        const rows = lines.map(line => 
          line.split(detectedSeparator).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
        );

        setAllRows(rows);
        setHeaders(rows[0]);

        // Créer les colonnes avec échantillons
        const csvColumns: CsvColumn[] = rows[0].map((header, index) => ({
          index,
          name: header,
          sample: rows.slice(1, 4).map(row => row[index] || '').filter(cell => cell)
        }));

        setColumns(csvColumns);

        // Tentative de détection automatique intelligente
        const autoMapping: ColumnMapping = {
          dateColumn: null,
          amountColumn: null,
          descriptionColumn: null
        };

        // Détecter la colonne date
        csvColumns.forEach(col => {
          const headerLower = col.name.toLowerCase();
          const hasDateKeywords = headerLower.includes('date') || 
                                 headerLower.includes('datum') || 
                                 headerLower.includes('jour');
          
          const sampleLooksLikeDate = col.sample.some(sample => 
            /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(sample) ||
            /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(sample)
          );

          if ((hasDateKeywords || sampleLooksLikeDate) && autoMapping.dateColumn === null) {
            autoMapping.dateColumn = col.index;
          }
        });

        // Détecter la colonne montant
        csvColumns.forEach(col => {
          const headerLower = col.name.toLowerCase();
          const hasAmountKeywords = headerLower.includes('montant') || 
                                   headerLower.includes('amount') || 
                                   headerLower.includes('prix') ||
                                   headerLower.includes('valeur') ||
                                   headerLower.includes('somme') ||
                                   headerLower.includes('euro') ||
                                   headerLower.includes('€');
          
          const sampleLooksLikeAmount = col.sample.some(sample => 
            /^\d+([.,]\d{1,2})?$/.test(sample.replace(/[€\s]/g, '')) ||
            /^\d+[.,]\d{2}/.test(sample)
          );

          if ((hasAmountKeywords || sampleLooksLikeAmount) && autoMapping.amountColumn === null) {
            autoMapping.amountColumn = col.index;
          }
        });

        // Détecter la colonne description (première colonne texte qui n'est ni date ni montant)
        csvColumns.forEach(col => {
          if (col.index !== autoMapping.dateColumn && 
              col.index !== autoMapping.amountColumn && 
              autoMapping.descriptionColumn === null) {
            const headerLower = col.name.toLowerCase();
            const hasDescriptionKeywords = headerLower.includes('description') || 
                                          headerLower.includes('libelle') || 
                                          headerLower.includes('libellé') ||
                                          headerLower.includes('designation') ||
                                          headerLower.includes('nom') ||
                                          headerLower.includes('intitule');
            
            if (hasDescriptionKeywords || col.sample.some(s => s.length > 5)) {
              autoMapping.descriptionColumn = col.index;
            }
          }
        });

        setMapping(autoMapping);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du parsing du CSV');
      } finally {
        setIsLoading(false);
      }
    };

    parseFile();
  }, [file, isOpen]);

  const handleColumnSelect = (field: keyof ColumnMapping, columnIndex: number) => {
    setMapping(prev => ({
      ...prev,
      [field]: prev[field] === columnIndex ? null : columnIndex
    }));
  };

  const getColumnTypeColor = (columnIndex: number) => {
    if (mapping.dateColumn === columnIndex) return 'bg-blue-100 border-blue-300 text-blue-700';
    if (mapping.amountColumn === columnIndex) return 'bg-green-100 border-green-300 text-green-700';
    if (mapping.descriptionColumn === columnIndex) return 'bg-purple-100 border-purple-300 text-purple-700';
    return 'bg-gray-50 border-gray-200 text-gray-600';
  };

  const getColumnTypeLabel = (columnIndex: number) => {
    if (mapping.dateColumn === columnIndex) return '📅 Date';
    if (mapping.amountColumn === columnIndex) return '💰 Montant';
    if (mapping.descriptionColumn === columnIndex) return '📝 Description';
    return '';
  };

  const canConfirm = mapping.dateColumn !== null && mapping.amountColumn !== null;

  const handleConfirm = () => {
    if (canConfirm) {
      onMappingConfirmed(mapping, headers, allRows);
    }
  };

  const formatSampleValue = (value: string, columnIndex: number) => {
    if (mapping.amountColumn === columnIndex) {
      const number = parseFloat(value.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (!isNaN(number)) {
        return new Intl.NumberFormat('fr-FR', { 
          style: 'currency', 
          currency: 'EUR' 
        }).format(number);
      }
    }
    if (mapping.dateColumn === columnIndex) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('fr-FR');
        }
      } catch {}
    }
    return value.length > 30 ? value.substring(0, 30) + '...' : value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  🗂️ Mapping des colonnes CSV
                </h3>
                <p className="text-sm text-gray-600">
                  Sélectionnez les colonnes correspondant à la date et au montant
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Analyse du fichier CSV...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Erreur de lecture</h4>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info fichier */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Fichier:</span>
                    <span className="ml-2 text-gray-900">{file?.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Lignes:</span>
                    <span className="ml-2 text-gray-900">{allRows.length - 1}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Séparateur:</span>
                    <span className="ml-2 text-gray-900 font-mono bg-gray-200 px-2 py-1 rounded">
                      {separator}
                    </span>
                  </div>
                </div>
              </div>

              {/* Types de colonnes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📅</span>
                    <span className="font-semibold text-blue-900">Date</span>
                    <span className="text-red-500">*</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Colonne contenant les dates des transactions
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💰</span>
                    <span className="font-semibold text-green-900">Montant</span>
                    <span className="text-red-500">*</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Colonne contenant les montants numériques
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📝</span>
                    <span className="font-semibold text-purple-900">Description</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Colonne avec les libellés (optionnel)
                  </p>
                </div>
              </div>

              {/* Aperçu des colonnes */}
              <div className="overflow-x-auto">
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))` }}>
                  {columns.map(column => (
                    <div
                      key={column.index}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${getColumnTypeColor(column.index)}`}
                    >
                      {/* Header de colonne */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">
                            Colonne {column.index + 1}
                          </span>
                          {getColumnTypeLabel(column.index) && (
                            <span className="text-xs px-2 py-1 rounded-full bg-white/70">
                              {getColumnTypeLabel(column.index)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 truncate">
                          {column.name || `Colonne ${column.index + 1}`}
                        </h4>
                      </div>

                      {/* Échantillons */}
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-medium text-gray-600">Échantillons:</p>
                        {column.sample.slice(0, 3).map((sample, idx) => (
                          <div 
                            key={idx}
                            className="text-xs bg-white/50 rounded px-2 py-1 font-mono"
                          >
                            {formatSampleValue(sample, column.index)}
                          </div>
                        ))}
                        {column.sample.length === 0 && (
                          <div className="text-xs text-gray-400 italic">Pas de données</div>
                        )}
                      </div>

                      {/* Boutons de sélection */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleColumnSelect('dateColumn', column.index)}
                          className={`w-full py-2 px-3 text-xs rounded-lg transition-colors ${
                            mapping.dateColumn === column.index
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {mapping.dateColumn === column.index ? (
                            <span className="flex items-center justify-center gap-1">
                              <Check className="w-3 h-3" /> Date sélectionnée
                            </span>
                          ) : (
                            '📅 Marquer comme Date'
                          )}
                        </button>

                        <button
                          onClick={() => handleColumnSelect('amountColumn', column.index)}
                          className={`w-full py-2 px-3 text-xs rounded-lg transition-colors ${
                            mapping.amountColumn === column.index
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {mapping.amountColumn === column.index ? (
                            <span className="flex items-center justify-center gap-1">
                              <Check className="w-3 h-3" /> Montant sélectionné
                            </span>
                          ) : (
                            '💰 Marquer comme Montant'
                          )}
                        </button>

                        <button
                          onClick={() => handleColumnSelect('descriptionColumn', column.index)}
                          className={`w-full py-2 px-3 text-xs rounded-lg transition-colors ${
                            mapping.descriptionColumn === column.index
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {mapping.descriptionColumn === column.index ? (
                            <span className="flex items-center justify-center gap-1">
                              <Check className="w-3 h-3" /> Description sélectionnée
                            </span>
                          ) : (
                            '📝 Marquer comme Description'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Récapitulatif */}
              {canConfirm && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Configuration prête</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">📅 Date:</span>
                      <span className="ml-2 text-gray-900">
                        {headers[mapping.dateColumn!]} (colonne {mapping.dateColumn! + 1})
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">💰 Montant:</span>
                      <span className="ml-2 text-gray-900">
                        {headers[mapping.amountColumn!]} (colonne {mapping.amountColumn! + 1})
                      </span>
                    </div>
                    {mapping.descriptionColumn !== null && (
                      <div>
                        <span className="font-medium text-gray-700">📝 Description:</span>
                        <span className="ml-2 text-gray-900">
                          {headers[mapping.descriptionColumn]} (colonne {mapping.descriptionColumn + 1})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="text-red-500">*</span> Champs obligatoires
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    canConfirm
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Importer avec ce mapping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
