import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export function useTransitionState() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return {
    isTransitioning,
    startTransition,
    endTransition,
    currentPath: location.pathname
  };
}