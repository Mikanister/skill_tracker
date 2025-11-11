import React from 'react';
import { Mode, Task } from '@/types';

export type TaskListItemProps = {
  task: Task;
  mode: Mode;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  mode,
  isFirst,
  isLast,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
    <input type="checkbox" checked={task.done} onChange={onToggle} disabled={false} />
    <span
      onClick={() => {
        if (mode === 'edit') onEdit();
      }}
      style={{ textDecoration: task.done ? 'line-through' : 'none', cursor: mode === 'edit' ? 'pointer' : 'default' }}
      title={task.description || ''}
    >
      {task.text}
      {task.difficulty ? ` · ⚙️${task.difficulty}` : ''}
    </span>

    {mode === 'edit' && (
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        <button onClick={onEdit} style={{ padding: '2px 6px' }}>
          Редагувати
        </button>
        <button onClick={onDelete} style={{ padding: '2px 6px' }}>
          Видалити
        </button>
        <button onClick={onMoveUp} style={{ padding: '2px 6px' }} disabled={isFirst}>
          ↑
        </button>
        <button onClick={onMoveDown} style={{ padding: '2px 6px' }} disabled={isLast}>
          ↓
        </button>
      </div>
    )}
  </div>
);
