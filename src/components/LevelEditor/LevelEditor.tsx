import React, { useState } from 'react';
import { Level, Mode, Task } from '@/types';
import { TaskModal } from '@/components/TaskModal';
import { LevelHeader } from './LevelHeader';
import { TaskList } from './TaskList';

type LevelEditorProps = {
  level: Level;
  mode: Mode;
  onChange: (level: Level) => void;
};

export const LevelEditor: React.FC<LevelEditorProps> = ({ level, mode, onChange }) => {
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const toggleTask = (taskId: string) => {
    const updated: Level = {
      ...level,
      tasks: level.tasks.map(task => (task.id === taskId ? { ...task, done: !task.done } : task))
    };
    onChange(updated);
  };

  const renameLevel = () => {
    const title = prompt('Назва рівня', level.title);
    if (title == null) return;
    onChange({ ...level, title: title.trim() });
  };

  const handleMoveTask = (taskId: string, direction: 'up' | 'down') => {
    const index = level.tasks.findIndex(task => task.id === taskId);
    if (index < 0) return;
    const delta = direction === 'up' ? -1 : 1;
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= level.tasks.length) return;

    const tasks = [...level.tasks];
    const [item] = tasks.splice(index, 1);
    tasks.splice(targetIndex, 0, item);
    onChange({ ...level, tasks });
  };

  const handleDeleteTask = (taskId: string) => {
    onChange({ ...level, tasks: level.tasks.filter(task => task.id !== taskId) });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setTaskModalOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    if (editingTask) {
      onChange({
        ...level,
        tasks: level.tasks.map(existing => (existing.id === task.id ? task : existing))
      });
    } else {
      onChange({ ...level, tasks: [...level.tasks, task] });
    }
  };

  return (
    <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 10, marginBottom: 10 }}>
      <LevelHeader level={level} mode={mode} onRename={renameLevel} />

      <TaskList
        tasks={level.tasks}
        mode={mode}
        onToggleTask={toggleTask}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onMoveTask={handleMoveTask}
      />

      {mode === 'edit' && (
        <button onClick={handleCreateTask} style={{ marginTop: 6, padding: '6px 10px' }}>+ Завдання</button>
      )}

      <TaskModal
        open={isTaskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        initial={editingTask}
        onSave={task => {
          handleSaveTask(task);
          setTaskModalOpen(false);
        }}
      />
    </div>
  );
};
