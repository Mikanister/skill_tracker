import { CSSProperties, ReactNode, useEffect } from 'react';

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

  const dialogStyle: CSSProperties | undefined = width ? ({ '--modal-width': `${width}px` } as CSSProperties) : undefined;

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div className="modal-dialog" style={dialogStyle} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">{title}</div>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

