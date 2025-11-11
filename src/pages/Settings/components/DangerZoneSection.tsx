import React from 'react';
import { SectionCard } from '@/components/SectionCard';

type ConfirmationField = {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

type DangerZoneSectionProps = {
  confirmationField: ConfirmationField;
  confirmationError?: string;
  confirmationValue: string;
  onSubmit: () => void;
  onInputFocus: () => void;
  onExportNow: () => void;
};

export const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({
  confirmationField,
  confirmationError,
  confirmationValue,
  onSubmit,
  onInputFocus,
  onExportNow
}) => (
  <SectionCard
    variant="danger"
    title="Небезпечна зона"
    description="Скидання видалить всі дані без можливості відновлення."
  >
    <div className="danger-panel">
      <strong className="text-sm text-strong">Що буде видалено:</strong>
      <ul className="list-muted">
        <li>Усі профілі бійців та їхній прогрес</li>
        <li>Каталог навичок і категорії</li>
        <li>Журнал задач і коментарі</li>
        <li>Налаштування та історія імпортів</li>
      </ul>
      <div className="danger-hint">
        <span>Бажано зберегти резервну копію перед очисткою.</span>
        <button onClick={onExportNow} className="btn-secondary">Експортувати зараз</button>
      </div>
    </div>
    <label className="labeled-field text-xs text-muted">
      <span>Для підтвердження введіть <strong>DELETE</strong>:</span>
      <input
        {...confirmationField}
        placeholder="Введіть DELETE"
        className="confirm-input"
        onFocus={onInputFocus}
      />
      {confirmationError && (
        <span className="text-xs" style={{ color: 'var(--danger)' }}>{confirmationError}</span>
      )}
    </label>
    <button
      onClick={onSubmit}
      className="btn-danger-strong"
      data-active={confirmationValue === 'DELETE'}
      style={{
        background: confirmationValue === 'DELETE' ? 'var(--danger-soft-bg)' : 'rgba(239,68,68,0.2)',
        cursor: confirmationValue === 'DELETE' ? 'pointer' : 'not-allowed'
      }}
      disabled={confirmationValue !== 'DELETE'}
    >
      🗑️ Скинути всі дані
    </button>
  </SectionCard>
);
