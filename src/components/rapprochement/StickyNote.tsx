import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, GripVertical, ChevronDown, ChevronUp, Pin } from 'lucide-react';
import type { BankTransaction } from '../../types/rapprochement';

interface StickyNoteProps {
  transactions: BankTransaction[];
  onRemoveTransaction: (txId: string) => void;
  onClose: () => void;
}

export default function StickyNote({ transactions, onRemoveTransaction, onClose }: StickyNoteProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }, [position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y))
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 320, touch.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, touch.clientY - dragOffset.current.y))
      });
    };

    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount);

  if (transactions.length === 0) return null;

  return (
    <div
      ref={noteRef}
      style={{ left: position.x, top: position.y }}
      className="fixed z-[100] select-none"
    >
      <div className={`bg-amber-50 border-2 border-amber-300 rounded-xl shadow-2xl w-[300px] overflow-hidden ${
        isDragging ? 'shadow-amber-200/50 scale-[1.02]' : ''
      } transition-shadow`}>
        {/* Header - draggable */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="flex items-center justify-between px-3 py-2 bg-amber-200/60 cursor-grab active:cursor-grabbing border-b border-amber-300/50"
        >
          <div className="flex items-center gap-1.5">
            <GripVertical className="h-3.5 w-3.5 text-amber-600/60" />
            <Pin className="h-3.5 w-3.5 text-amber-700" />
            <span className="text-xs font-bold text-amber-900">
              {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 hover:bg-amber-300/50 rounded transition-colors"
            >
              {collapsed
                ? <ChevronDown className="h-3.5 w-3.5 text-amber-700" />
                : <ChevronUp className="h-3.5 w-3.5 text-amber-700" />
              }
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-200/60 rounded transition-colors"
            >
              <X className="h-3.5 w-3.5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!collapsed && (
          <div className="max-h-[300px] overflow-y-auto">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-3 py-2 border-b border-amber-200/50 last:border-b-0 hover:bg-amber-100/50"
              >
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1 py-px rounded ${
                      tx.type === 'debit' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'
                    }`}>
                      {tx.type === 'debit' ? 'ACH' : 'VTE'}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-900 truncate">{tx.description}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-amber-700/70">{tx.date}</span>
                    <span className={`text-[11px] font-bold tabular-nums ${
                      tx.type === 'debit' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {tx.type === 'debit' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveTransaction(tx.id)}
                  className="p-0.5 hover:bg-amber-300/50 rounded flex-shrink-0"
                  title="Retirer du post-it"
                >
                  <X className="h-3 w-3 text-amber-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer total */}
        {!collapsed && transactions.length > 0 && (
          <div className="px-3 py-1.5 bg-amber-200/40 border-t border-amber-300/50 flex items-center justify-between">
            <span className="text-[10px] text-amber-700 font-medium">Total</span>
            <span className="text-xs font-bold text-amber-900 tabular-nums">
              {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
