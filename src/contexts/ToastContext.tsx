import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  description?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, description?: string) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, description }]);
    
    // Auto hide after 5 seconds
    setTimeout(() => hideToast(id), 5000);
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onHide }: { toasts: Toast[], onHide: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-lg border backdrop-blur-md",
              toast.type === 'success' && "bg-green-50/90 border-green-100 text-green-800",
              toast.type === 'error' && "bg-red-50/90 border-red-100 text-red-800",
              toast.type === 'warning' && "bg-orange-50/90 border-orange-100 text-orange-800",
              toast.type === 'info' && "bg-blue-50/90 border-blue-100 text-blue-800"
            )}
          >
            <div className="mt-0.5">
              {toast.type === 'success' && <CheckCircle size={18} className="text-green-500" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
              {toast.type === 'warning' && <AlertTriangle size={18} className="text-orange-500" />}
              {toast.type === 'info' && <Info size={18} className="text-blue-500" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">{toast.message}</p>
              {toast.description && (
                <p className="text-xs mt-1 opacity-80 leading-relaxed line-clamp-2">{toast.description}</p>
              )}
            </div>

            <button 
              onClick={() => onHide(toast.id)}
              className="mt-0.5 p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
