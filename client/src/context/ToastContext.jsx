import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  useEffect(() => {
    const handleRateLimit = (event) => {
      const message = event.detail?.message || 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.';
      addToast(message, 'warning');
    };

    window.addEventListener('api-rate-limit', handleRateLimit);
    return () => {
      window.removeEventListener('api-rate-limit', handleRateLimit);
    };
  }, [addToast]);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  // Icon mapping based on toast type
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <span className="material-symbols-outlined text-emerald-500 text-xl flex">check_circle</span>;
      case 'error':
        return <span className="material-symbols-outlined text-rose-500 text-xl flex">error</span>;
      case 'warning':
        return <span className="material-symbols-outlined text-amber-500 text-xl flex">warning</span>;
      case 'info':
      default:
        return <span className="material-symbols-outlined text-sky-500 text-xl flex">info</span>;
    }
  };

  // Color theme mapping
  const getColors = (type) => {
    switch (type) {
      case 'success':
        return {
          border: 'border-l-4 border-l-emerald-500 border-slate-100 dark:border-slate-800/80',
          bg: 'bg-white/95 dark:bg-slate-900/95',
          text: 'text-slate-850 dark:text-slate-200',
          progress: 'bg-emerald-500',
        };
      case 'error':
        return {
          border: 'border-l-4 border-l-rose-500 border-slate-100 dark:border-slate-800/80',
          bg: 'bg-white/95 dark:bg-slate-900/95',
          text: 'text-slate-855 dark:text-slate-200',
          progress: 'bg-rose-500',
        };
      case 'warning':
        return {
          border: 'border-l-4 border-l-amber-500 border-slate-100 dark:border-slate-800/80',
          bg: 'bg-white/95 dark:bg-slate-900/95',
          text: 'text-slate-855 dark:text-slate-200',
          progress: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          border: 'border-l-4 border-l-sky-500 border-slate-100 dark:border-slate-800/80',
          bg: 'bg-white/95 dark:bg-slate-900/95',
          text: 'text-slate-855 dark:text-slate-200',
          progress: 'bg-sky-500',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Global Toast Portal/Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3.5 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => {
          const colors = getColors(t.type);
          return (
            <div
              key={t.id}
              className={`relative overflow-hidden flex items-center gap-3.5 p-4 pr-5 rounded-xl border shadow-[0_10px_35px_-5px_rgba(0,0,0,0.1),0_8px_20px_-6px_rgba(0,0,0,0.05)] backdrop-blur-md pointer-events-auto transform transition-all duration-300 animate-slide-in ${colors.border} ${colors.bg} ${colors.text}`}
            >
              <div className="shrink-0">{getIcon(t.type)}</div>
              <div className="flex-1 text-sm font-semibold leading-relaxed tracking-wide text-slate-800 dark:text-slate-100">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-lg block">close</span>
              </button>
              
              {/* Shinking bottom timer progress bar */}
              <div
                className={`absolute bottom-0 left-0 h-[3px] ${colors.progress}`}
                style={{
                  animation: `shrink ${t.duration}ms linear forwards`,
                }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
