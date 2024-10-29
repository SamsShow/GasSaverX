import React from 'react';
import { X } from 'lucide-react';

const ToastContext = React.createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback(({ title, description, action, duration = 5000, variant = 'default', icon }) => {
    const id = Date.now();
    const newToast = {
      id,
      title,
      description,
      action,
      variant,
      icon
    };
    
    setToasts(prev => [...prev, newToast]);

    if (duration !== Infinity) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return { toast: context.addToast };
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ id, title, description, action, variant = 'default', icon, onClose }) => {
  const variants = {
    default: 'bg-white border-gray-200',
    destructive: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200'
  };

  return (
    <div
      className={`${variants[variant]} rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-right-full`}
      role="alert"
    >
      <div className="flex w-full items-start gap-3">
        {icon && <span className="text-gray-600">{icon}</span>}
        <div className="flex-1">
          {title && (
            <div className="font-medium text-gray-900">{title}</div>
          )}
          {description && (
            <div className="mt-1 text-sm text-gray-600">{description}</div>
          )}
          {action && (
            <div className="mt-2">
              {action}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastAction = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 ${className}`}
  >
    {children}
  </button>
);