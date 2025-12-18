import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, Link } from 'react-router-dom';
import { Home, Building2, BarChart3 } from 'lucide-react';

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
      className="app-page md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-cyan-100/70 z-40 safe-area-inset shadow-[0_-8px_24px_rgba(14,116,144,0.12)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex budget-container px-1 pb-1">
        {menuItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex-1 flex flex-col items-center py-2 px-1 mx-0.5 rounded-xl transition-all ${
              isActive(path)
                ? 'text-cyan-700 bg-cyan-50/70 shadow-[0_0_16px_rgba(34,211,238,0.25)]'
                : 'text-gray-600 hover:text-cyan-700 hover:bg-white/70'
            }`}
          >
            <Icon className="h-4 w-4 mb-1" />
            <span className="text-fit-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );

  if (!mounted) return null;

  return createPortal(nav, document.body);
}
