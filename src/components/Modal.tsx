import { ReactNode, useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
};

export function Modal({ open, onClose, title, children, width = 520, footer }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="no-print"
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--modal-overlay)',
        backdropFilter: 'blur(18px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: 24
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width,
          maxWidth: '94vw',
          maxHeight: '90vh',
          background: 'var(--modal-surface)',
          color: 'var(--fg)',
          borderRadius: 18,
          border: '1px solid var(--modal-border)',
          boxShadow: 'var(--modal-shadow)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: '0 0 auto',
            background: 'var(--modal-head-bg)'
          }}
        >
          <div style={{ flex: 1, fontSize: 18, fontWeight: 700, letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 12 }}>
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-panel-alt)',
              color: 'var(--fg)',
              fontSize: 13
            }}
          >✕</button>
        </div>
        <div style={{ padding: 20, overflow: 'auto', flex: '1 1 auto' }}>
          {children}
        </div>
        {footer && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--surface-panel-alt)',
              flex: '0 0 auto'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

