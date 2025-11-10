import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Fighter, TaskComment, TaskStatusHistoryEntry, TaskV2, TaskV2Status } from '@/types';
import { Modal } from '@/components/Modal';

export type TaskViewModalProps = {
  task: TaskV2 | null;
  fighters: Fighter[];
  tasks: TaskV2[];
  skillIndex: Map<string, { name: string; categoryId: string }>;
  approved: Record<string, Record<string, number>>;
  setApproved: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  commentDraft: string;
  setCommentDraft: React.Dispatch<React.SetStateAction<string>>;
  titleDraft: string;
  setTitleDraft: React.Dispatch<React.SetStateAction<string>>;
  descriptionDraft: string;
  setDescriptionDraft: React.Dispatch<React.SetStateAction<string>>;
  priorityDraft: boolean;
  setPriorityDraft: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onSaveDetails: (taskId: string, payload: { title: string; description?: string; isPriority: boolean; changeNotes: string[] }) => void;
  onAddComment: (taskId: string, message: string) => void;
  onStatusChange: (task: TaskV2, status: TaskV2Status) => void;
  statusLabels: Record<TaskV2Status, string>;
  formatDateTime: (value?: number) => string;
};

export const TaskViewModal: React.FC<TaskViewModalProps> = ({
  task,
  fighters,
  tasks,
  skillIndex,
  approved,
  setApproved,
  commentDraft,
  setCommentDraft,
  titleDraft,
  setTitleDraft,
  descriptionDraft,
  setDescriptionDraft,
  priorityDraft,
  setPriorityDraft,
  onClose,
  onDelete,
  onSaveDetails,
  onAddComment,
  onStatusChange,
  statusLabels,
  formatDateTime
}) => {
  const [statusDraft, setStatusDraft] = useState<TaskV2Status>('todo');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const statusOptions = useMemo(() => (
    Object.keys(statusLabels)
      .filter(key => key !== 'archived')
      .map(key => key as TaskV2Status)
  ), [statusLabels]);

  useEffect(() => {
    if (!task) return;
    setTitleDraft(task.title);
    setDescriptionDraft(task.description ?? '');
    setPriorityDraft(!!task.isPriority);
    setStatusDraft(task.status);
    setStatusMenuOpen(false);
    const init: Record<string, Record<string, number>> = {};
    for (const assignee of task.assignees) {
      init[assignee.fighterId] = {};
      for (const skill of assignee.skills) {
        init[assignee.fighterId][skill.skillId] = skill.xpApproved ?? skill.xpSuggested;
      }
    }
    setApproved(init);
  }, [task, setTitleDraft, setDescriptionDraft, setPriorityDraft, setApproved]);

  useEffect(() => {
    setCommentDraft('');
  }, [task, setCommentDraft]);

  useEffect(() => {
    if (!statusMenuOpen) return;
    const handler = (event: MouseEvent) => {
      if (!statusMenuRef.current?.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusMenuOpen]);

  const trimmedTitle = titleDraft.trim();
  const trimmedDescription = descriptionDraft.trim();
  const titleError = trimmedTitle.length === 0;

  const detailsDirty = useMemo(() => {
    if (!task) return false;
    return (
      trimmedTitle !== task.title.trim() ||
      trimmedDescription !== (task.description ?? '').trim() ||
      priorityDraft !== !!task.isPriority ||
      statusDraft !== task.status
    );
  }, [task, trimmedTitle, trimmedDescription, priorityDraft, statusDraft]);

  const activityEntries = useMemo(() => {
    if (!task) return [] as ({ type: 'status'; entry: TaskStatusHistoryEntry } | { type: 'comment'; entry: TaskComment })[];
    const statusEntries = (task.history ?? []).map(entry => ({ type: 'status' as const, entry }));
    const commentEntries = (task.comments ?? []).map(entry => ({ type: 'comment' as const, entry }));
    return [...statusEntries, ...commentEntries].sort((a, b) => {
      const timeA = a.type === 'status' ? a.entry.changedAt : a.entry.createdAt;
      const timeB = b.type === 'status' ? b.entry.changedAt : b.entry.createdAt;
      return timeB - timeA;
    });
  }, [task]);

  if (!task) return null;

  return (
    <Modal
      open={!!task}
      onClose={onClose}
      title={task ? (
        <div className="task-modal-header">
          <span className="task-modal-title">Задача №{task.taskNumber ?? '—'}</span>
          <div className="task-modal-status" ref={statusMenuRef}>
            <button
              type="button"
              className="task-modal-status-pill"
              onClick={event => {
                event.stopPropagation();
                setStatusMenuOpen(prev => !prev);
              }}
            >
              <span className="task-modal-status-dot" data-status={statusDraft} />
              {statusLabels[statusDraft]}
            </button>
            {statusMenuOpen && (
              <div className="task-modal-status-menu">
                {statusOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={option === statusDraft ? 'status-menu-option is-active' : 'status-menu-option'}
                    onClick={event => {
                      event.stopPropagation();
                      setStatusDraft(option);
                      setStatusMenuOpen(false);
                    }}
                  >
                    <span className="task-modal-status-dot" data-status={option} />
                    {statusLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : ''}
      width={840}
      footer={task ? (
        <div className="modal-footer-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              if (!task || titleError) return;
              const changeNotes: string[] = [];
              if (trimmedTitle !== task.title.trim()) changeNotes.push('назву задачі');
              if (trimmedDescription !== (task.description ?? '').trim()) changeNotes.push('опис задачі');
              if (statusDraft !== task.status) changeNotes.push('статус задачі');
              onSaveDetails(task.id, {
                title: trimmedTitle,
                description: trimmedDescription || undefined,
                isPriority: priorityDraft,
                changeNotes
              });
              if (statusDraft !== task.status) {
                onStatusChange(task, statusDraft);
              }
            }}
            disabled={!detailsDirty || titleError}
          >
            Зберегти
          </button>
          <button
            className="btn-danger-soft"
            aria-label={task ? `Видалити задачу «${task.title}»` : 'Видалити задачу'}
            onClick={() => {
              if (!task) return;
              if (!confirm(`Видалити задачу «${task.title}»?`)) return;
              onDelete(task.id);
            }}
          >
            Видалити задачу
          </button>
        </div>
      ) : undefined}
    >
      <div className="modal-stack">
        <div className="modal-text-muted">Скоригуйте XP для кожного бійця та скіла. Anti-exploit зменшує рекомендації при повторюваних задачах.</div>

        <section className="section-stack">
          <strong className="section-title">Основна інформація</strong>
          <label className="labeled-field">
            <span className="field-label">Назва задачі</span>
            <input
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              placeholder="Назва задачі"
              className="input-control"
            />
            {titleError && <span className="helper-text" style={{ color: 'var(--danger)' }}>Назва не може бути порожньою</span>}
          </label>
          <label className="labeled-field">
            <span className="field-label">Опис задачі</span>
            <textarea
              value={descriptionDraft}
              onChange={e => setDescriptionDraft(e.target.value)}
              rows={3}
              placeholder="Додайте опис задачі"
              className="textarea-control"
            />
          </label>
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={priorityDraft}
              onChange={e => setPriorityDraft(e.target.checked)}
            />
            <span>Позначити як пріоритетну</span>
          </label>
        </section>

        {/* XP секція тимчасово прихована за вимогою */}

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
                    <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>{formatDateTime(changedAt)}</span>
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
                  <div className="text-sm text-strong" style={{ color: 'var(--fg)' }}>{message}</div>
                </li>
              );
            })}
            {activityEntries.length === 0 && <li className="text-sm text-muted">Записів поки немає.</li>}
          </ul>
        </section>

        <section className="section-stack">
          <strong className="section-title">Додати коментар</strong>
          <textarea
            value={commentDraft}
            onChange={e => setCommentDraft(e.target.value)}
            rows={3}
            placeholder="Поділитися оновленням або рішенням по задачі"
            className="textarea-control"
          />
          <div className="comment-actions">
            <button
              onClick={() => {
                if (!task) return;
                const trimmed = commentDraft.trim();
                if (!trimmed) return;
                onAddComment(task.id, trimmed);
                setCommentDraft('');
              }}
              disabled={!commentDraft.trim()}
              className="btn-panel"
            >Залишити коментар</button>
          </div>
        </section>
      </div>
    </Modal>
  );
};
