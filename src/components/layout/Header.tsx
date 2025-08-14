import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Building2, FolderOpen, Layers, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '../ui/Button';
import CompanySelector from '../company/CompanySelector';

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
    { path: '/companies', icon: Building2, label: 'Sociétés' }
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="relative">
                <Layers className="h-6 w-6 md:h-8 md:w-8 text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg opacity-20 blur-sm"></div>
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-900">MGHV</span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              {menuItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(path)
                      ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-cyan-600'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* Actions - Desktop */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              <CompanySelector />
              
              <div className="h-6 w-px bg-gray-200" />
              
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50">
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

          {/* Menu Button - Mobile */}
          {user && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-cyan-600 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && user && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="py-2 space-y-1">
              {menuItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-4 py-2 text-base font-medium ${
                    isActive(path)
                      ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:text-cyan-600'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {label}
                </Link>
              ))}
            </div>

            <div className="py-2 border-t border-gray-200">
              <div className="px-4 py-2">
                <CompanySelector />
              </div>
              
              <div className="mt-2 px-4 py-2 flex items-center justify-between">
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