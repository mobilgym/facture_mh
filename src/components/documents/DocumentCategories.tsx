import React from 'react';
import { Folder, Users, Calculator, Scale, Building2 } from 'lucide-react';

const categories = [
  { id: 'rh', name: 'Ressources Humaines', icon: Users },
  { id: 'compta', name: 'Comptabilité', icon: Calculator },
  { id: 'juridique', name: 'Juridique', icon: Scale },
  { id: 'admin', name: 'Administration', icon: Building2 }
];

interface DocumentCategoriesProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function DocumentCategories({ selectedCategory, onSelectCategory }: DocumentCategoriesProps) {
  return (
    <div className="glass-panel rounded-xl budget-container">
      <div className="p-3 sm:p-4 border-b border-cyan-100/70">
        <h2 className="text-fit-md font-semibold text-gray-900">Catégories</h2>
      </div>
      <div className="p-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-cyan-50/60 transition-colors ${
            selectedCategory === null ? 'bg-cyan-100/70 text-cyan-800' : 'text-gray-700'
          }`}
        >
          <Folder className="h-4 w-4 text-cyan-500 shrink-0" />
          <span className="text-fit-sm font-medium truncate">Tous les documents</span>
        </button>
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-cyan-50/60 transition-colors ${
                selectedCategory === category.id ? 'bg-cyan-100/70 text-cyan-800' : 'text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4 text-cyan-500 shrink-0" />
              <span className="text-fit-sm font-medium truncate">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
