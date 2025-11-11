import React from 'react';

type FightersHeaderProps = {
  fighterCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  groupByUnit: boolean;
  onToggleGroup: (value: boolean) => void;
  onOpenCreate: () => void;
};

export const FightersHeader: React.FC<FightersHeaderProps> = ({
  fighterCount,
  search,
  onSearchChange,
  groupByUnit,
  onToggleGroup,
  onOpenCreate
}) => (
  <header style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
    <div style={{ flex: '1 1 220px', minWidth: 220 }}>
      <h2 style={{ margin: 0, fontSize: 30 }}>Особовий склад</h2>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{fighterCount} бійців у строю</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '2 1 320px', minWidth: 260 }}>
      <input
        placeholder="Пошук бійця"
        value={search}
        onChange={event => onSearchChange(event.target.value)}
        style={{
          flex: 1,
          padding: '12px 14px',
          borderRadius: 14,
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-panel)',
          color: 'var(--fg)',
          boxShadow: 'var(--shadow-sm)'
        }}
      />
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
        <input type="checkbox" checked={groupByUnit} onChange={event => onToggleGroup(event.target.checked)} />
        Групувати за підрозділом
      </label>
    </div>
    <button
      onClick={onOpenCreate}
      style={{
        padding: '12px 18px',
        borderRadius: 14,
        background: 'var(--accent-soft-bg)',
        border: '1px solid var(--accent-soft-border)',
        color: 'var(--fg)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      + Додати бійця
    </button>
  </header>
);
