import React from 'react';

const DIFFICULTY_OPTIONS: (1|2|3|4|5)[] = [1, 2, 3, 4, 5];

export type TaskFormFieldsProps = {
  title: string;
  description: string;
  difficulty: 1|2|3|4|5;
  done: boolean;
  canToggleDone: boolean;
  error: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDifficultyChange: (value: 1|2|3|4|5) => void;
  onDoneChange: (value: boolean) => void;
  onClearError: () => void;
};

export const TaskFormFields: React.FC<TaskFormFieldsProps> = ({
  title,
  description,
  difficulty,
  done,
  canToggleDone,
  error,
  onTitleChange,
  onDescriptionChange,
  onDifficultyChange,
  onDoneChange,
  onClearError
}) => (
  <div className="modal-stack">
    {error && (
      <div className="alert-danger-soft" role="alert">
        {error}
      </div>
    )}

    <label className="labeled-field text-sm text-muted">
      <span className="text-strong">Назва</span>
      <input
        value={title}
        onChange={event => {
          onTitleChange(event.target.value);
          if (error) onClearError();
        }}
        className="input-control input-control--wide"
      />
    </label>

    <label className="labeled-field text-sm text-muted">
      <span className="text-strong">Опис</span>
      <textarea
        value={description}
        onChange={event => onDescriptionChange(event.target.value)}
        rows={4}
        className="textarea-control"
      />
    </label>

    <label className="labeled-field labeled-field--inline text-sm text-muted">
      <span className="text-strong">Складність</span>
      <select
        value={difficulty}
        onChange={event => onDifficultyChange(Number(event.target.value) as 1|2|3|4|5)}
        className="input-control"
      >
        {DIFFICULTY_OPTIONS.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>

    {canToggleDone && (
      <label className="checkbox-inline text-sm text-muted">
        <input
          type="checkbox"
          checked={done}
          onChange={event => onDoneChange(event.target.checked)}
        />
        <span>Позначити виконаним</span>
      </label>
    )}
  </div>
);
