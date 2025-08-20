import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Building2, FolderOpen, BarChart3, DollarSign } from 'lucide-react';

export default function MobileBottomNavigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/companies', icon: Building2, label: 'Sociétés' },
    { path: '/budgets', icon: BarChart3, label: 'Budgets' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex">
        {menuItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors ${
              isActive(path)
                ? 'text-cyan-600 bg-cyan-50'
                : 'text-gray-600 hover:text-cyan-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
