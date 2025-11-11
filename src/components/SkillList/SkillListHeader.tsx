import React from 'react';

export type SkillListHeaderProps = {
  draftName: string;
  onDraftChange: (value: string) => void;
  canCreate: boolean;
  onCreate: () => void;
};

export const SkillListHeader: React.FC<SkillListHeaderProps> = ({ draftName, onDraftChange, canCreate, onCreate }) => (
  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
    <input
      placeholder="Новий скіл..."
      value={draftName}
      onChange={event => onDraftChange(event.target.value)}
      style={{ flex: 1, padding: 8, borderRadius: 6 }}
    />
    <button
      onClick={onCreate}
      disabled={!canCreate}
      style={{ padding: '8px 12px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 6 }}
    >
      Додати
    </button>
  </div>
);
