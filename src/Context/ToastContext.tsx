import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig = {
  success: {
    icon: CheckCircle2,
    className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-200",
    iconColor: "text-emerald-400",
  },
  error: {
    icon: AlertCircle,
    className: "bg-red-500/10 border-red-500/20 text-red-200",
    iconColor: "text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-amber-500/10 border-amber-500/20 text-amber-200",
    iconColor: "text-amber-400",
  },
  info: {
    icon: Info,
    className: "bg-blue-500/10 border-blue-500/20 text-blue-200",
    iconColor: "text-blue-400",
  },
};

const ToastItem = ({
  toast,
  onRemove,
  duration,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
  duration: number;
}) => {
  const { id, message, type } = toast;
  const config = toastConfig[type];
  const Icon = config.icon;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`
        pointer-events-auto flex items-center gap-3 w-full max-w-sm p-4 rounded-xl border backdrop-blur-xl shadow-lg
        ${config.className}
      `}
    >
      <Icon size={20} className={`shrink-0 ${config.iconColor}`} />
      
      <p className="flex-1 text-sm font-Inter font-medium leading-relaxed">
        {message}
      </p>

      <button
        onClick={() => onRemove(id)}
        className="shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
      >
        <X size={14} className="opacity-70" />
      </button>
    </motion.div>
  );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, message, type };
      
      setToasts((prev) => [newToast, ...prev]); 
      
    },
    []
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      <div className="fixed top-14 right-4 z-100 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onRemove={removeToast}
              duration={4000} 
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}