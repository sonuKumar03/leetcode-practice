import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (opts: { type: ToastType; message: string }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DISMISS_MS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  info: 4000,
};

const MAX_VISIBLE = 3;

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-brand flex-shrink-0" />,
};

const borderMap: Record<ToastType, string> = {
  success: 'border-emerald-500/30',
  error: 'border-rose-500/30',
  info: 'border-brand/30',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, message }: { type: ToastType; message: string }) => {
      const id = ++idRef.current;
      setToasts((prev) => {
        const next = [...prev, { id, type, message }];
        return next.slice(-MAX_VISIBLE);
      });
      setTimeout(() => removeToast(id), DISMISS_MS[type]);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container: fixed bottom-right */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl bg-elevated border ${borderMap[t.type]} shadow-lg text-sm text-text-main animate-fade-in max-w-sm`}
            >
              {iconMap[t.type]}
              <span className="flex-1 min-w-0">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="text-text-subtle hover:text-text-main p-0.5 rounded transition-colors cursor-pointer flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
