import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import Header from '@/components/layout/Header';
import PageTransition from '@/components/layout/PageTransition';
import LoadingOverlay from '@/components/layout/LoadingOverlay';
import AppContent from './AppContent';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <PageTransition>
              <AppContent />
            </PageTransition>
          </div>
          <LoadingOverlay isLoading={false} />
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}