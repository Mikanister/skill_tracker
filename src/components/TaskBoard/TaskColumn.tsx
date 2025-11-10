import React from 'react';
import clsx from 'clsx';
import { TaskV2, TaskV2Status } from '@/types';

type TaskColumnProps = {
  status: TaskV2Status;
  title: string;
  tasks: TaskV2[];
  expanded: boolean;
  visibleLimit: number;
  isDropTarget: boolean;
  onToggleExpand: (status: TaskV2Status) => void;
  onDragEnter: (status: TaskV2Status) => void;
  onDragLeave: () => void;
  onDrop: (status: TaskV2Status) => void;
  renderTask: (task: TaskV2) => React.ReactNode;
};

export const TaskColumn: React.FC<TaskColumnProps> = ({
  status,
  title,
  tasks,
  expanded,
  visibleLimit,
  isDropTarget,
  onToggleExpand,
  onDragEnter,
  onDragLeave,
  onDrop,
  renderTask
}) => {
  const visibleTasks = expanded ? tasks : tasks.slice(0, visibleLimit);
  const hiddenCount = Math.max(tasks.length - visibleTasks.length, 0);

  return (
    <div
      className={clsx('board-column', { 'drop-target': isDropTarget })}
      onDragOver={event => {
        event.preventDefault();
        onDragEnter(status);
      }}
      onDragLeave={onDragLeave}
      onDrop={event => {
        event.preventDefault();
        onDrop(status);
      }}
    >
      <div className="board-column-header">
        <div className="board-column-title">{title}</div>
        <span className="board-column-count">{tasks.length}</span>
      </div>
      <div className="board-tasks">
        {visibleTasks.map(task => (
          <React.Fragment key={task.id}>{renderTask(task)}</React.Fragment>
        ))}
      </div>
      {hiddenCount > 0 && (
        <button
          onClick={() => onToggleExpand(status)}
          className="board-column-footer"
        >
          {expanded ? 'Згорнути список' : `Показати ще ${hiddenCount}`}
        </button>
      )}
    </div>
  );
};
