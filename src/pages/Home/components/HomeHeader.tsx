import React from 'react';
import { Fighter } from '@/types';

type HomeHeaderProps = {
  activeCount: number;
  fighters: Fighter[];
  assigneeFilter: string;
  onAssigneeChange: (value: string) => void;
  onOpenCreate: () => void;
};

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  activeCount,
  fighters,
  assigneeFilter,
  onAssigneeChange,
  onOpenCreate
}) => (
  <header style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ flex: 1 }}>
      <h2 style={{ margin: 0, fontSize: 32 }}>Дошка задач</h2>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{activeCount} активних задач</div>
    </div>
    <div style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Фільтр за виконавцем</span>
      <select
        value={assigneeFilter}
        onChange={event => onAssigneeChange(event.target.value)}
        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
      >
        <option value="all">Усі виконавці</option>
        {fighters.map(fighter => (
          <option key={fighter.id} value={fighter.id}>{fighter.name}</option>
        ))}
      </select>
    </div>
    <button
      onClick={onOpenCreate}
      style={{ padding: '12px 18px', borderRadius: 14, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, letterSpacing: '0.02em', boxShadow: 'var(--shadow-sm)' }}
    >
      + Створити задачу
    </button>
  </header>
);
