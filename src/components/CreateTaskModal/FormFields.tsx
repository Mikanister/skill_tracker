import React from 'react';

const DIFFICULTY_OPTIONS: (1|2|3|4|5)[] = [1, 2, 3, 4, 5];

export type CreateTaskDetailsProps = {
  title: string;
  description: string;
  xp: number;
  difficulty: 1|2|3|4|5;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onXpChange: (value: number) => void;
  onDifficultyChange: (value: 1|2|3|4|5) => void;
};

export const CreateTaskDetails: React.FC<CreateTaskDetailsProps> = ({
  title,
  description,
  xp,
  difficulty,
  onTitleChange,
  onDescriptionChange,
  onXpChange,
  onDifficultyChange
}) => (
  <div style={{ display: 'grid', gap: 12 }}>
    <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
      <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Назва</span>
      <input
        value={title}
        onChange={event => onTitleChange(event.target.value)}
        placeholder="Опишіть задачу"
        style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }}
      />
    </label>

    <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
      <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Опис</span>
      <textarea
        value={description}
        onChange={event => onDescriptionChange(event.target.value)}
        rows={4}
        placeholder="Додайте деталі або посилання"
        style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)', resize: 'vertical' }}
      />
    </label>

    <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
      <span style={{ fontWeight: 600, color: 'var(--fg)' }}>XP за задачу</span>
      <input
        type="number"
        value={xp}
        onChange={event => onXpChange(Number(event.target.value) || 0)}
        style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }}
      />
    </label>

    <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
      <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Складність</span>
      <select
        value={difficulty}
        onChange={event => onDifficultyChange(Number(event.target.value) as 1|2|3|4|5)}
        style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }}
      >
        {DIFFICULTY_OPTIONS.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  </div>
);
