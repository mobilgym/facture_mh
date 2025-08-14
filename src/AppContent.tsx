import React from 'react';
import { usePreloadData } from '@/lib/hooks/usePreloadData';
import AppRoutes from './routes';

export default function AppContent() {
  usePreloadData(); // Now used within Router context

  return (
    <div className="min-h-screen bg-gray-50">
      <AppRoutes />
    </div>
  );
}