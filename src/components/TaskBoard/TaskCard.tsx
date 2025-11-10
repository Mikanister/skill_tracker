import React from 'react';
import clsx from 'clsx';
import { Fighter, TaskV2, TaskV2Status } from '@/types';

const STATUS_LABELS: Record<TaskV2Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  validation: 'Validation',
  done: 'Done',
  archived: 'Archived'
};

type TaskCardProps = {
  task: TaskV2;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onSelect: () => void;
  fightersMap: Map<string, Fighter>;
  onArchive?: (task: TaskV2) => void;
  onRestore: (task: TaskV2) => void;
  onStatusChange?: (task: TaskV2, next: TaskV2Status) => void;
  formatDateTime: (value?: number) => string;
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onSelect,
  fightersMap,
  onRestore,
  formatDateTime
}) => {
  return (
    <div
      className={clsx('task-card', { dragging: isDragging })}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
    >
      <div className="task-card-header">
        <div className="task-card-heading">
          <span className="task-card-title">{task.title}</span>
          <div className="task-card-meta-row">
            {task.isPriority && <span className="task-priority-dot" aria-label="Пріоритетна задача" />}
            {task.difficulty && (<span className="task-chips">⚩️ {task.difficulty}</span>)}
            {task.status !== 'archived' && (
              <span className="task-status-pill">
                <span className="task-status-dot" />
                {STATUS_LABELS[task.status]}
              </span>
            )}
          </div>
        </div>
        {task.status === 'archived' && (
          <button
            onClick={event => {
              event.stopPropagation();
              onRestore(task);
            }}
            className="btn-panel"
          >
            Відновити
          </button>
        )}
      </div>

      {task.description && <div className="task-card-body">{task.description}</div>}

      <div className="task-card-tags">
        {task.assignees.map(assignee => {
          const fighter = fightersMap.get(assignee.fighterId);
          if (!fighter) return null;
          const label = fighter.callsign || fighter.name;
          return (
            <span key={assignee.fighterId} className="task-chip">
              <span className="task-chip-dot" />
              {label}
            </span>
          );
        })}
      </div>

      {task.comments?.length ? (
        <div className="task-card-footer">
          <span className="task-comment-author">
            <span aria-hidden="true">💬</span>
            {task.comments[task.comments.length - 1]?.author}
          </span>
          <span className="task-comment-time">{formatDateTime(task.comments[task.comments.length - 1]?.createdAt)}</span>
        </div>
      ) : null}
    </div>
  );
}
;
