import React from 'react';
import { EmptyState } from '@/components/EmptyState';
import { TaskColumn } from '@/components/TaskBoard/TaskColumn';
import { TaskV2, TaskV2Status } from '@/types';

type TaskBoardSectionProps = {
  boardColumns: [TaskV2Status, string][];
  byStatus: Record<TaskV2Status, TaskV2[]>;
  expandedColumns: Record<TaskV2Status, boolean>;
  dropTargetStatus: TaskV2Status | null;
  columnVisibleLimit: number;
  noTasks: boolean;
  noFilteredMatches: boolean;
  assigneeFilter: string;
  onResetFilter: () => void;
  onOpenCreate: () => void;
  onToggleExpand: (status: TaskV2Status) => void;
  onDragEnter: (status: TaskV2Status) => void;
  onDragLeave: () => void;
  onDrop: (status: TaskV2Status) => void;
  renderTask: (task: TaskV2) => React.ReactNode;
};

export const TaskBoardSection: React.FC<TaskBoardSectionProps> = ({
  boardColumns,
  byStatus,
  expandedColumns,
  dropTargetStatus,
  columnVisibleLimit,
  noTasks,
  noFilteredMatches,
  assigneeFilter,
  onResetFilter,
  onOpenCreate,
  onToggleExpand,
  onDragEnter,
  onDragLeave,
  onDrop,
  renderTask
}) => {
  if (noTasks) {
    return (
      <div style={{ flex: 1, borderRadius: 18, border: '1px dashed var(--border-subtle)', background: 'var(--surface-glass-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
        <EmptyState
          icon="🗂️"
          title="Поки що немає задач"
          description="Створіть першу задачу, щоб відстежувати прогрес бійців."
          action={{ label: '+ Створити задачу', onClick: onOpenCreate }}
        />
      </div>
    );
  }

  if (noFilteredMatches) {
    return (
      <div style={{ flex: 1, borderRadius: 18, border: '1px dashed var(--border-subtle)', background: 'var(--surface-glass-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
        <EmptyState
          icon="🕵️"
          title="Немає задач за вибраним виконавцем"
          description="Спробуйте вибрати іншого бійця або скинути фільтр."
          action={assigneeFilter !== 'all' ? { label: 'Скинути фільтр', onClick: onResetFilter } : undefined}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))', gap: 18, minHeight: 0, flex: 1 }}>
      {boardColumns.map(([status, label]) => (
        <TaskColumn
          key={status}
          status={status}
          title={label}
          tasks={byStatus[status]}
          expanded={expandedColumns[status]}
          visibleLimit={columnVisibleLimit}
          isDropTarget={dropTargetStatus === status}
          onToggleExpand={onToggleExpand}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          renderTask={renderTask}
        />
      ))}
    </div>
  );
};
