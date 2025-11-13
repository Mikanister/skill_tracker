import React from 'react';

const DIFFICULTY_OPTIONS: (1|2|3|4|5)[] = [1, 2, 3, 4, 5];

export type FormControlsProps = {
  title: string;
  difficulty: 1|2|3|4|5;
  isPriority: boolean;
  description: string;
  error: string | null;
  onTitleChange: (value: string) => void;
  onDifficultyChange: (value: 1|2|3|4|5) => void;
  onPriorityChange: (value: boolean) => void;
  onDescriptionChange: (value: string) => void;
};

export const FormControls: React.FC<FormControlsProps> = ({
  title,
  difficulty,
  isPriority,
  description,
  error,
  onTitleChange,
  onDifficultyChange,
  onPriorityChange,
  onDescriptionChange
}) => (
  <>
    <div className="multiassign-row">
      <label className="labeled-field text-sm text-muted">
        <span className="text-strong" id="multiassign-title-label">Назва</span>
        <input
          aria-labelledby="multiassign-title-label"
          value={title}
          onChange={event => onTitleChange(event.target.value)}
          placeholder="Вкажіть назву"
          className="input-control"
        />
      </label>
      <label className="labeled-field text-sm text-muted">
        <span className="text-strong" id="multiassign-difficulty-label">Складність</span>
        <select
          aria-labelledby="multiassign-difficulty-label"
          value={difficulty}
          onChange={event => onDifficultyChange(Number(event.target.value) as 1|2|3|4|5)}
          className="input-control"
        >
          {DIFFICULTY_OPTIONS.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    </div>

    <label className="multiassign-inline text-sm" style={{ cursor: 'pointer' }}>
      <input type="checkbox" checked={isPriority} onChange={event => onPriorityChange(event.target.checked)} />
      <span style={{ fontWeight: 600 }}>Пріоритетно</span>
    </label>

    <label className="labeled-field text-sm text-muted">
      <span className="text-strong" id="multiassign-description-label">Опис</span>
      <textarea
        aria-labelledby="multiassign-description-label"
        value={description}
        onChange={event => onDescriptionChange(event.target.value)}
        rows={4}
        placeholder="Додайте короткий опис"
        className="textarea-control"
      />
    </label>

    {error && <div className="alert-danger-soft">{error}</div>}
  </>
);
