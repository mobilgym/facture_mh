import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';

interface BubbleItem {
  id: string;
  name: string;
  color: string;
  description?: string;
  subtitle?: string;
  disabled?: boolean;
}

interface BubblePickerProps {
  items: BubbleItem[];
  selectedItems: BubbleItem[];
  onItemSelect: (item: BubbleItem) => void;
  onItemRemove: (itemId: string) => void;
  placeholder?: string;
  maxSelection?: number;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  label?: string;
  emptyMessage?: string;
  allowMultiple?: boolean;
}

export function BubblePicker({
  items,
  selectedItems,
  onItemSelect,
  onItemRemove,
  placeholder = "Cliquer pour sélectionner",
  maxSelection,
  disabled = false,
  searchable = true,
  className = '',
  label,
  emptyMessage = "Aucun élément disponible",
  allowMultiple = true
}: BubblePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fermer popup en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Bloquer le scroll sur mobile quand popup ouverte
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isMobile]);

  // Filtrer les éléments disponibles
  const filteredItems = items.filter(item => {
    const isAlreadySelected = selectedItems.some(selected => selected.id === item.id);
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return !isAlreadySelected && matchesSearch && !item.disabled;
  });

  const canAddMore = !maxSelection || selectedItems.length < maxSelection;

  const handleItemClick = (item: BubbleItem) => {
    if (!disabled && (canAddMore || !allowMultiple)) {
      onItemSelect(item);
      setSearchTerm('');
      if (!allowMultiple) {
        setIsOpen(false);
      }
    }
  };

  const handleRemoveItem = (itemId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    if (!disabled) {
      onItemRemove(itemId);
    }
  };

  const getDisplayText = () => {
    if (selectedItems.length === 0) return placeholder;
    if (selectedItems.length === 1 && !allowMultiple) return selectedItems[0].name;
    return `${selectedItems.length} sélectionné${selectedItems.length > 1 ? 's' : ''}`;
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
        </label>
      )}

      {/* Affichage des éléments sélectionnés sous forme de billes */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedItems.map(item => (
            <div
              key={item.id}
              className="group relative inline-flex items-center"
            >
              {/* Bille colorée principale */}
              <div
                className="w-10 h-10 rounded-full shadow-lg border-2 border-white cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-xl flex items-center justify-center"
                style={{ backgroundColor: item.color }}
                title={item.name}
              >
                <Check className="w-4 h-4 text-white opacity-80" />
              </div>
              
              {/* Bouton de suppression au hover */}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveItem(item.id, e)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
              
              {/* Tooltip avec le nom */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                {item.name}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Déclencheur principal */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && (canAddMore || !allowMultiple || selectedItems.length === 0) && setIsOpen(!isOpen)}
        disabled={disabled || (allowMultiple && !canAddMore)}
        className={`
          w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 
          border-2 border-dashed rounded-xl bg-gradient-to-r from-gray-50 to-gray-100
          ${disabled || (allowMultiple && !canAddMore) 
            ? 'opacity-50 cursor-not-allowed border-gray-200' 
            : 'hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98] border-gray-300'
          }
          transition-all duration-200 group
        `}
      >
        <Plus className={`w-5 h-5 transition-colors ${selectedItems.length > 0 ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
        <span className={`text-sm font-medium transition-colors ${selectedItems.length > 0 ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
          {getDisplayText()}
        </span>
      </button>

      {/* Pop-up moderne avec billes */}
      {isOpen && !disabled && (canAddMore || !allowMultiple || selectedItems.length === 0) && (
        <>
          {/* Overlay mobile */}
          {isMobile && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200" />
          )}

          <div
            ref={popupRef}
            className={`
              absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden
              ${isMobile 
                ? 'fixed left-4 right-4 top-1/2 -translate-y-1/2 max-h-[80vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-200' 
                : 'w-full bottom-full mb-2 max-h-96 animate-in zoom-in-95 slide-in-from-bottom-2 duration-150'
              }
            `}
          >
            {/* Header avec recherche */}
            {searchable && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-10 pr-3 py-2.5 border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm bg-white/80 backdrop-blur-sm"
                    autoFocus={!isMobile}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Grille de billes cliquables */}
            <div className={`${isMobile ? 'max-h-[50vh]' : 'max-h-64'} overflow-y-auto p-6`}>
              {filteredItems.length > 0 ? (
                <div className="space-y-6">
                  {/* Titre de section */}
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {allowMultiple ? 'Sélectionnez vos éléments' : 'Choisissez un élément'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {allowMultiple && maxSelection && `Maximum ${maxSelection} sélections`}
                    </p>
                  </div>

                  {/* Grille de billes */}
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
                    {filteredItems.map(item => (
                      <div key={item.id} className="flex flex-col items-center space-y-2">
                        {/* Bille cliquable */}
                        <button
                          onClick={() => handleItemClick(item)}
                          className="group relative w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-95"
                          style={{ backgroundColor: item.color }}
                        >
                          {/* Effet de brillance */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Icône ou initiale */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {item.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Indicateur de hover */}
                          <div className="absolute inset-0 rounded-full border-2 border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </button>
                        
                        {/* Label */}
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-900 truncate max-w-[80px]">
                            {item.name}
                          </p>
                          {item.subtitle && (
                            <p className="text-xs text-gray-500 truncate max-w-[80px]">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {searchTerm ? 'Aucun résultat' : 'Aucun élément disponible'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {searchTerm ? `Aucun élément trouvé pour "${searchTerm}"` : emptyMessage}
                  </p>
                </div>
              )}
            </div>

            {/* Footer mobile */}
            {isMobile && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm shadow-sm"
                >
                  Terminer la sélection
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Limite atteinte */}
      {allowMultiple && maxSelection && selectedItems.length >= maxSelection && (
        <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
          <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
          Limite atteinte ({selectedItems.length}/{maxSelection})
        </p>
      )}
    </div>
  );
}
