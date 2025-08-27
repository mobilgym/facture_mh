import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from '@/components/auth/AuthGuard';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Companies from '@/pages/Companies';
import Documents from '@/pages/Documents';
import FolderView from '@/pages/FolderView';
import { BudgetsAndExpenses } from '@/pages/BudgetsAndExpenses';
import Lettrage from '@/pages/Lettrage';



export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      } />
      <Route path="/companies" element={
        <AuthGuard>
          <Companies />
        </AuthGuard>
      } />
      <Route path="/documents" element={
        <AuthGuard>
          <Documents />
        </AuthGuard>
      } />

      <Route path="/folder/:folderId" element={
        <AuthGuard>
          <FolderView />
        </AuthGuard>
      } />
      <Route path="/budgets" element={
        <AuthGuard>
          <BudgetsAndExpenses />
        </AuthGuard>
      } />
      <Route path="/lettrage" element={
        <AuthGuard>
          <Lettrage />
        </AuthGuard>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}