import React, { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const AuthContext = createContext<ReturnType<typeof useSupabaseAuth>>({} as ReturnType<typeof useSupabaseAuth>);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useSupabaseAuth();
  const navigate = useNavigate();

  // Redirection automatique si non authentifié
  React.useEffect(() => {
    if (!auth.loading && !auth.user) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/signup') {
        navigate('/login', { replace: true });
      }
    }
  }, [auth.user, auth.loading, navigate]);

  return (
    <AuthContext.Provider value={auth}>
      {!auth.loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};