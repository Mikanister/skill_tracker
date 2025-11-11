import React from 'react';
import { Mode, Skill } from '@/types';

export type SkillDetailHeaderProps = {
  skill: Skill;
  mode: Mode;
  progress: {
    pct: number;
    done: number;
    total: number;
  };
  onToggleArchive: () => void;
  onClone: () => void;
  onDelete: () => void;
};

export const SkillDetailHeader: React.FC<SkillDetailHeaderProps> = ({
  skill,
  mode,
  progress,
  onToggleArchive,
  onClone,
  onDelete
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <h3 style={{ margin: 0 }}>{skill.name}</h3>
    <span style={{ color: 'var(--muted)' }}>
      (прогрес: {progress.pct}% — {progress.done}/{progress.total})
    </span>
    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
      {mode === 'edit' && (
        <button onClick={onToggleArchive} style={{ padding: '6px 10px' }}>
          {skill.isArchived ? 'Розархівувати' : 'Архівувати'}
        </button>
      )}
      {mode === 'edit' && (
        <button onClick={onClone} style={{ padding: '6px 10px' }}>
          Клонувати
        </button>
      )}
      {mode === 'edit' && (
        <button
          onClick={onDelete}
          style={{ padding: '6px 10px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 6 }}
        >
          Видалити
        </button>
      )}
    </div>
  </div>
);
