import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, Link } from 'react-router-dom';
import { Home, Building2, FolderOpen, BarChart3, DollarSign } from 'lucide-react';

export default function MobileBottomNavigation() {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/companies', icon: Building2, label: 'Sociétés' },
    { path: '/budgets', icon: BarChart3, label: 'Budgets' }
  ];

  const nav = (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
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

  if (!mounted) return null;

  return createPortal(nav, document.body);
}
