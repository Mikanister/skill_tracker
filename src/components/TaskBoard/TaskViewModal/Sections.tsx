import React from 'react';
import { TaskV2, TaskV2Status } from '@/types';
import { TaskActivityEntry } from '@/components/TaskBoard/taskActivity';

export type TaskDetailsSectionProps = {
  titleDraft: string;
  onTitleChange: (value: string) => void;
  titleError: boolean;
  descriptionDraft: string;
  onDescriptionChange: (value: string) => void;
  priorityDraft: boolean;
  onPriorityChange: (value: boolean) => void;
};

export const TaskDetailsSection: React.FC<TaskDetailsSectionProps> = ({
  titleDraft,
  onTitleChange,
  titleError,
  descriptionDraft,
  onDescriptionChange,
  priorityDraft,
  onPriorityChange
}) => (
  <section className="section-stack">
    <strong className="section-title">Основна інформація</strong>
    <label className="labeled-field">
      <span className="field-label">Назва задачі</span>
      <input
        value={titleDraft}
        onChange={event => onTitleChange(event.target.value)}
        placeholder="Назва задачі"
        className="input-control"
      />
      {titleError && <span className="helper-text helper-text--danger">Назва не може бути порожньою</span>}
    </label>
    <label className="labeled-field">
      <span className="field-label">Опис задачі</span>
      <textarea
        value={descriptionDraft}
        onChange={event => onDescriptionChange(event.target.value)}
        rows={3}
        placeholder="Додайте опис задачі"
        className="textarea-control"
      />
    </label>
    <label className="checkbox-inline">
      <input
        type="checkbox"
        checked={priorityDraft}
        onChange={event => onPriorityChange(event.target.checked)}
      />
      <span>Позначити як пріоритетну</span>
    </label>
  </section>
);

export type TaskHistorySectionProps = {
  activityEntries: TaskActivityEntry[];
  statusLabels: Record<TaskV2Status, string>;
  formatDateTime: (value?: number) => string;
};

export const TaskHistorySection: React.FC<TaskHistorySectionProps> = ({ activityEntries, statusLabels, formatDateTime }) => (
  <section className="section-stack">
    <strong className="section-title">Історія статусів</strong>
    <ul className="history-list">
      {activityEntries.map((item, idx) => {
        if (item.type === 'status') {
          const { fromStatus, toStatus, changedAt } = item.entry;
          const fromLabel = fromStatus ? statusLabels[fromStatus as TaskV2Status] : 'Створено';
          const toLabel = statusLabels[toStatus];
          return (
            <li key={`status-${toStatus}-${changedAt}-${idx}`} className="history-item">
              <span className="text-xs text-muted">{fromLabel} →</span>
              <span className="text-strong">{toLabel}</span>
              <span className="text-xs text-muted ml-auto">{formatDateTime(changedAt)}</span>
            </li>
          );
        }

        const { author, message, createdAt, id } = item.entry;
        return (
          <li key={`comment-${id}-${idx}`} className="history-item history-item--comment">
            <div className="flex-row align-center gap-8">
              <strong className="text-sm text-strong">{author}</strong>
              <span className="text-xs text-muted">{formatDateTime(createdAt)}</span>
            </div>
            <div className="text-sm text-strong">{message}</div>
          </li>
        );
      })}
      {activityEntries.length === 0 && <li className="text-sm text-muted">Записів поки немає.</li>}
    </ul>
  </section>
);

export type TaskCommentSectionProps = {
  commentDraft: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
};

export const TaskCommentSection: React.FC<TaskCommentSectionProps> = ({ commentDraft, onCommentChange, onSubmit }) => (
  <section className="section-stack">
    <strong className="section-title">Додати коментар</strong>
    <textarea
      value={commentDraft}
      onChange={event => onCommentChange(event.target.value)}
      rows={3}
      placeholder="Поділитися оновленням або рішенням по задачі"
      className="textarea-control"
      aria-label="Коментар по задачі"
    />
    <div className="comment-actions">
      <button
        onClick={onSubmit}
        disabled={!commentDraft.trim()}
        className="btn-panel"
      >
        Залишити коментар
      </button>
    </div>
  </section>
);
