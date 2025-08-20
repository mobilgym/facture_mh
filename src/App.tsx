import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { BudgetNotificationProvider } from '@/contexts/BudgetNotificationContext';
import Header from '@/components/layout/Header';
import PageTransition from '@/components/layout/PageTransition';
import LoadingOverlay from '@/components/layout/LoadingOverlay';
import MobileBottomNavigation from '@/components/layout/MobileBottomNavigation';
import AppContent from './AppContent';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <BudgetNotificationProvider>
            <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
              <Header />
              <PageTransition>
                <AppContent />
              </PageTransition>
              <MobileBottomNavigation />
            </div>
            <LoadingOverlay isLoading={false} />
          </BudgetNotificationProvider>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}