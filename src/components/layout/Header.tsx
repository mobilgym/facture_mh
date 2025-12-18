import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Building2, FolderOpen, Layers, User, Menu, X, BarChart3, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '../ui/Button';
import CompactCompanySelector from '../company/CompactCompanySelector';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: FolderOpen, label: 'Documents' },
    { path: '/companies', icon: Building2, label: 'Sociétés' },
    { path: '/budgets', icon: BarChart3, label: 'Budgets' },
    { path: '/lettrage', icon: RefreshCcw, label: 'Lettrage' }
  ];

  return (
    <header className="app-page sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-cyan-100/70 shadow-[0_8px_24px_rgba(14,116,144,0.12)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-12 md:h-14 budget-container">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="relative">
                <Layers className="h-6 w-6 md:h-8 md:w-8 text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg opacity-20 blur-sm"></div>
              </div>
              <span className="text-fit-md font-bold text-gray-900 tracking-tight">MGHV</span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          {user && (
            <nav className="hidden md:flex items-center gap-2">
              {menuItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-fit-xs transition-all ${
                    isActive(path)
                      ? 'neon-cta shadow-[0_0_18px_rgba(34,211,238,0.4)]'
                      : 'neon-cta-outline hover:-translate-y-0.5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Actions - Desktop */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              <CompactCompanySelector />
              
              <div className="h-6 w-px bg-cyan-100" />
              
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 p-2 rounded-full bg-white/60 border border-cyan-100/70 hover:bg-white/80 transition-all">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-cyan-600" />
                  </div>
                </button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Actions */}
          {user && (
            <div className="md:hidden flex items-center space-x-2">
              <CompactCompanySelector />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full text-gray-600 hover:text-cyan-600 bg-white/60 border border-cyan-100/70 hover:bg-white/80 transition-all"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && user && (
          <div className="md:hidden border-t border-cyan-100/70 bg-white/80 backdrop-blur-xl">
            <div className="py-2 space-y-2">
              {menuItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 mx-3 px-3 py-2 rounded-full text-fit-sm font-semibold transition-all ${
                    isActive(path)
                      ? 'neon-cta'
                      : 'neon-cta-outline'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>

            <div className="py-2 border-t border-cyan-100/70">
              <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-cyan-600" />
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
