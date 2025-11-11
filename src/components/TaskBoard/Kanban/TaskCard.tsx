import React from 'react';

export type SkillChip = {
  id: string;
  label: string;
  xp: number;
};

export type TaskCardProps = {
  title: string;
  difficulty?: number;
  description?: string;
  skillChips: SkillChip[];
  actions?: React.ReactNode;
};

export const TaskCard: React.FC<TaskCardProps> = ({ title, difficulty, description, skillChips, actions }) => (
  <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8, marginBottom: 8, background: 'var(--card-bg)' }}>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <strong>{title}</strong>
      {difficulty ? (
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>⚩️{difficulty}</span>
      ) : null}
    </div>

    {description && <div style={{ marginTop: 6, fontSize: 13 }}>{description}</div>}

    {skillChips.length > 0 && (
      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {skillChips.map(chip => (
          <span
            key={chip.id}
            style={{ fontSize: 12, padding: '2px 6px', background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 999 }}
          >
            {chip.label} · {chip.xp} XP
          </span>
        ))}
      </div>
    )}

    {actions && (
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {actions}
      </div>
    )}
  </div>
);
