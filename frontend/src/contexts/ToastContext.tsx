import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { Button } from "../components/ui/button";
import { Icons } from "../components/ui/icons";

// ============================================================================
// TOAST TYPES
// ============================================================================

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

// ============================================================================
// TOAST CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// ============================================================================
// TOAST PROVIDER
// ============================================================================

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  const addToast = useCallback((toast: Omit<Toast, "id">): string => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      persistent: false,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after duration (unless persistent)
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// ============================================================================
// TOAST CONTAINER COMPONENT
// ============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

// ============================================================================
// TOAST ITEM COMPONENT
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  const handleActionClick = useCallback(() => {
    if (toast.action) {
      toast.action.onClick();
      handleRemove();
    }
  }, [toast.action, handleRemove]);

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out";
    const visibilityStyles =
      isVisible && !isLeaving
        ? "translate-x-0 opacity-100"
        : "translate-x-full opacity-0";

    return `${baseStyles} ${visibilityStyles}`;
  };

  const getTypeStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <Icons.check className="w-5 h-5 text-green-600" />;
      case "error":
        return <Icons.x className="w-5 h-5 text-red-600" />;
      case "warning":
        return <Icons.alertTriangle className="w-5 h-5 text-yellow-600" />;
      case "info":
        return <Icons.info className="w-5 h-5 text-blue-600" />;
      default:
        return <Icons.info className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div
      className={`${getToastStyles()} ${getTypeStyles()} border rounded-lg shadow-lg p-4`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>

        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium">{toast.title}</h4>

          {toast.message && (
            <p className="mt-1 text-sm opacity-90">{toast.message}</p>
          )}

          {toast.action && (
            <div className="mt-3">
              <Button
                onClick={handleActionClick}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {toast.action.label}
              </Button>
            </div>
          )}
        </div>

        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleRemove}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md"
            aria-label="Dismiss notification"
          >
            <Icons.x className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TOAST HOOKS
// ============================================================================

export const useToastNotifications = () => {
  const { addToast } = useToast();

  const showSuccess = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: "success",
        title,
        message,
        ...options,
      });
    },
    [addToast]
  );

  const showError = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: "error",
        title,
        message,
        duration: 8000, // Longer duration for errors
        ...options,
      });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: "warning",
        title,
        message,
        ...options,
      });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: "info",
        title,
        message,
        ...options,
      });
    },
    [addToast]
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
