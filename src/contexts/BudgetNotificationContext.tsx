import React, { createContext, useContext, useCallback } from 'react';

interface BudgetNotificationContextType {
  notifyBudgetChange: () => void;
  onBudgetChange: (callback: () => void) => () => void; // Retourne une fonction de cleanup
}

const BudgetNotificationContext = createContext<BudgetNotificationContextType | undefined>(undefined);

interface BudgetNotificationProviderProps {
  children: React.ReactNode;
}

export function BudgetNotificationProvider({ children }: BudgetNotificationProviderProps) {
  const callbacks = React.useRef<Set<() => void>>(new Set());
  const lastNotificationTime = React.useRef<number>(0);
  const NOTIFICATION_THROTTLE = 500; // 500ms entre les notifications

  const notifyBudgetChange = useCallback(() => {
    const now = Date.now();
    if (now - lastNotificationTime.current < NOTIFICATION_THROTTLE) {
      console.log('🔔 BudgetNotificationContext - Notification throttled');
      return;
    }
    
    lastNotificationTime.current = now;
    console.log('🔔 BudgetNotificationContext - Notification de changement de budget');
    callbacks.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Erreur lors de l\'exécution du callback de notification budget:', error);
      }
    });
  }, []);

  const onBudgetChange = useCallback((callback: () => void) => {
    // console.log('📝 BudgetNotificationContext - Enregistrement d\'un callback');
    callbacks.current.add(callback);
    
    // Retourner une fonction de cleanup
    return () => {
      // console.log('🗑️ BudgetNotificationContext - Suppression d\'un callback');
      callbacks.current.delete(callback);
    };
  }, []);

  return (
    <BudgetNotificationContext.Provider value={{ notifyBudgetChange, onBudgetChange }}>
      {children}
    </BudgetNotificationContext.Provider>
  );
}

export function useBudgetNotification() {
  const context = useContext(BudgetNotificationContext);
  if (context === undefined) {
    throw new Error('useBudgetNotification must be used within a BudgetNotificationProvider');
  }
  return context;
}
