import React from 'react';
import { Folder, Users, Calculator, Scale, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium text-gray-900">Catégories</h2>
      </div>
      <div className="p-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full flex items-center p-2 rounded-md hover:bg-gray-100 ${
            selectedCategory === null ? 'bg-blue-50 text-blue-700' : ''
          }`}
        >
          <Folder className="h-5 w-5 mr-3 text-gray-400" />
          <span>Tous les documents</span>
        </button>
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`w-full flex items-center p-2 rounded-md hover:bg-gray-100 ${
                selectedCategory === category.id ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <Icon className="h-5 w-5 mr-3 text-gray-400" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}