import React from 'react';
import clsx from 'clsx';
import { Fighter, TaskV2 } from '@/types';

type TaskCardProps = {
  task: TaskV2;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onSelect: () => void;
  fightersMap: Map<string, Fighter>;
  onArchive?: (task: TaskV2) => void;
  onRestore: (task: TaskV2) => void;
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onSelect,
  fightersMap,
  onArchive,
  onRestore
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
            {task.isPriority && (
              <span className="task-priority-chip" aria-label="Пріоритетна задача">
                <span className="task-priority-chip-dot" />
                Пріоритет
              </span>
            )}
            {task.hasUnreadComments && (
              <span
                className="task-comment-indicator"
                aria-label="Непрочитані коментарі"
                title="Нові коментарі"
              />
            )}
          </div>
        </div>
        <div className="task-card-header-aside">
          {typeof task.difficulty === 'number' && (
            <span className="task-difficulty-badge" aria-label="Складність задачі">
              ⚙️ {task.difficulty}
            </span>
          )}
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

    </div>
  );
};
