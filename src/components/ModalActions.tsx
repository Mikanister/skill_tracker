import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const BUTTON_VARIANT_CLASSNAMES = {
  panel: 'btn-panel',
  primary: 'btn-primary',
  'primary-soft': 'btn-primary-soft',
  secondary: 'btn-secondary',
  'success-soft': 'btn-success-soft',
  'danger-soft': 'btn-danger-soft',
  danger: 'btn-danger'
} as const;

export type ModalActionVariant = keyof typeof BUTTON_VARIANT_CLASSNAMES;

export type ModalAction = {
  label: string;
  onClick: () => void;
  variant?: ModalActionVariant;
  disabled?: boolean;
  className?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  ariaLabel?: string;
};

export type ModalActionsProps = {
  actions: ModalAction[];
  start?: ReactNode;
  align?: 'end' | 'between';
};

export const ModalActions: React.FC<ModalActionsProps> = ({ actions, start, align }) => {
  const resolvedAlign = align ?? (start ? 'between' : 'end');
  const containerClass = clsx('modal-footer-actions', {
    'modal-footer-actions--between': resolvedAlign === 'between'
  });

  return (
    <div className={containerClass}>
      {start ? <div className="modal-footer-actions__start">{start}</div> : null}
      <div className="modal-footer-actions__end">
        {actions.map(({ label, onClick, variant = 'primary', disabled, className, type, ariaLabel }, index) => (
          <button
            key={`${label}-${index}`}
            type={type ?? 'button'}
            onClick={onClick}
            disabled={disabled}
            className={clsx(BUTTON_VARIANT_CLASSNAMES[variant] ?? variant, className)}
            aria-label={ariaLabel}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
