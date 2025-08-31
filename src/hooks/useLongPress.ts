import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: (event?: TouchEvent | MouseEvent) => void;
  onShortPress?: (event?: TouchEvent | MouseEvent) => void;
  delay?: number;
  shouldPreventDefault?: boolean;
}

export function useLongPress({
  onLongPress,
  onShortPress,
  delay = 800,
  shouldPreventDefault = true
}: UseLongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isLongPressRef = useRef(false);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback((event: TouchEvent | MouseEvent) => {
    if (shouldPreventDefault && event.target) {
      (event.target as Element).addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Stocker la position initiale
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    startPositionRef.current = { x: clientX, y: clientY };

    isLongPressRef.current = false;

    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress(event);
    }, delay);
  }, [onLongPress, delay, shouldPreventDefault]);

  const clear = useCallback((event?: TouchEvent | MouseEvent, shouldTriggerOnShortPress = true) => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
    
    // Si c'est un court press et qu'on a un callback pour ça
    if (shouldTriggerOnShortPress && !isLongPressRef.current && onShortPress && event) {
      // Vérifier que l'utilisateur n'a pas bougé trop loin (pour éviter les faux positifs lors du scroll)
      const clientX = 'changedTouches' in event ? event.changedTouches[0].clientX : event.clientX;
      const clientY = 'changedTouches' in event ? event.changedTouches[0].clientY : event.clientY;
      
      if (startPositionRef.current) {
        const distance = Math.sqrt(
          Math.pow(clientX - startPositionRef.current.x, 2) + 
          Math.pow(clientY - startPositionRef.current.y, 2)
        );
        
        // Seuil de 10px pour considérer que c'est un tap et pas un drag
        if (distance < 10) {
          onShortPress(event);
        }
      }
    }
  }, [onShortPress]);

  const handlers = {
    onMouseDown: (e: React.MouseEvent) => start(e.nativeEvent),
    onMouseUp: (e: React.MouseEvent) => clear(e.nativeEvent),
    onMouseLeave: () => clear(),
    onTouchStart: (e: React.TouchEvent) => start(e.nativeEvent),
    onTouchEnd: (e: React.TouchEvent) => clear(e.nativeEvent),
    onTouchMove: () => clear(undefined, false), // Ne pas déclencher onShortPress sur le move
  };

  return handlers;
}