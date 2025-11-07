import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastMessage = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type Props = {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
};

export function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 400
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
      }, duration);
      return () => {
        clearTimeout(timer);
      };
    }
    return () => {};
  }, [toast.id, toast.duration, onDismiss]);

  const bgColors = {
    success: 'var(--success-bg)',
    error: 'var(--danger-bg)',
    info: 'var(--info-bg)',
    warning: '#fff3cd'
  };

  const borderColors = {
    success: 'var(--success-border)',
    error: 'var(--danger-border)',
    info: 'var(--info-border)',
    warning: '#ffc107'
  };

  return (
    <div
      style={{
        background: bgColors[toast.type],
        border: `1px solid ${borderColors[toast.type]}`,
        borderRadius: 8,
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 300,
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
        transition: 'all 0.3s ease-out'
      }}
    >
      <div style={{ flex: 1, fontSize: 14 }}>{toast.message}</div>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            onDismiss(toast.id);
          }}
          aria-label={toast.action.label}
          style={{
            padding: '4px 12px',
            fontSize: 13,
            fontWeight: 600,
            background: 'transparent',
            border: `1px solid ${borderColors[toast.type]}`,
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        aria-label="Закрити сповіщення"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          padding: 0,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = 'info', options?: {
    duration?: number;
    action?: { label: string; onClick: () => void };
  }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type, ...options }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return {
    toasts,
    showToast,
    dismissToast,
    success: (msg: string, opts?: any) => showToast(msg, 'success', opts),
    error: (msg: string, opts?: any) => showToast(msg, 'error', opts),
    info: (msg: string, opts?: any) => showToast(msg, 'info', opts),
    warning: (msg: string, opts?: any) => showToast(msg, 'warning', opts)
  };
}
