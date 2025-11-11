import React from 'react';
import { TaskV2, TaskV2Status } from '@/types';

export type TaskViewModalHeaderProps = {
  task: TaskV2;
  statusDraft: TaskV2Status;
  statusOptions: TaskV2Status[];
  statusLabels: Record<TaskV2Status, string>;
  statusMenuOpen: boolean;
  onToggleMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSelectStatus: (status: TaskV2Status, event: React.MouseEvent<HTMLButtonElement>) => void;
  statusMenuRef: React.RefObject<HTMLDivElement>;
};

export const TaskViewModalHeader: React.FC<TaskViewModalHeaderProps> = ({
  task,
  statusDraft,
  statusOptions,
  statusLabels,
  statusMenuOpen,
  onToggleMenu,
  onSelectStatus,
  statusMenuRef
}) => (
  <div className="task-modal-header">
    <span className="task-modal-title">Задача №{task.taskNumber ?? '—'}</span>
    <div className="task-modal-status" ref={statusMenuRef}>
      <button
        type="button"
        className="task-modal-status-pill"
        onClick={onToggleMenu}
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
              onClick={event => onSelectStatus(option, event)}
            >
              <span className="task-modal-status-dot" data-status={option} />
              {statusLabels[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);
