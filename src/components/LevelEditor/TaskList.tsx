import React from 'react';
import { Mode, Task } from '@/types';
import { TaskListItem } from './TaskListItem';

type TaskListProps = {
  tasks: Task[];
  mode: Mode;
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, direction: 'up' | 'down') => void;
};

export const TaskList: React.FC<TaskListProps> = ({ tasks, mode, onToggleTask, onEditTask, onDeleteTask, onMoveTask }) => (
  <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
    {tasks.map((task, index) => (
      <li key={task.id}>
        <TaskListItem
          task={task}
          mode={mode}
          isFirst={index === 0}
          isLast={index === tasks.length - 1}
          onToggle={() => onToggleTask(task.id)}
          onEdit={() => onEditTask(task)}
          onDelete={() => onDeleteTask(task.id)}
          onMoveUp={() => onMoveTask(task.id, 'up')}
          onMoveDown={() => onMoveTask(task.id, 'down')}
        />
      </li>
    ))}
  </ul>
);
