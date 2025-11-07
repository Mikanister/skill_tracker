import { Level, Mode, Task } from '@/types';
import { useState } from 'react';
import { TaskModal } from './TaskModal';

type Props = {
  level: Level;
  mode: Mode;
  onChange: (level: Level) => void;
};

export function LevelEditor({ level, mode, onChange }: Props) {
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const toggleTask = (taskId: string) => {
    const updated: Level = {
      ...level,
      tasks: level.tasks.map(t => (t.id === taskId ? { ...t, done: !t.done } : t))
    };
    onChange(updated);
  };

  const addTask = () => {
    setEditingTask(undefined);
    setTaskModalOpen(true);
  };

  const renameLevel = () => {
    const title = prompt('Назва рівня', level.title);
    if (title == null) return;
    onChange({ ...level, title: title.trim() });
  };

  return (
    <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong>Рівень {level.level}: {level.title}</strong>
        {mode === 'edit' && (
          <button onClick={renameLevel} style={{ padding: '4px 8px' }}>Перейменувати</button>
        )}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
        {level.tasks.map(t => (
          <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggleTask(t.id)}
              disabled={mode === 'edit' ? false : false}
            />
            <span
              onClick={() => {
                if (mode === 'edit') {
                  setEditingTask(t);
                  setTaskModalOpen(true);
                }
              }}
              style={{ textDecoration: t.done ? 'line-through' : 'none', cursor: mode === 'edit' ? 'pointer' : 'default' }}
              title={t.description || ''}
            >
              {t.text}
              {t.difficulty ? ` · ⚙️${t.difficulty}` : ''}
            </span>
            {mode === 'edit' && (
              <button
                onClick={() => {
                  setEditingTask(t);
                  setTaskModalOpen(true);
                }}
                style={{ marginLeft: 'auto', padding: '2px 6px' }}
              >
                Редагувати
              </button>
            )}
            {mode === 'edit' && (
              <button
                onClick={() => onChange({ ...level, tasks: level.tasks.filter(x => x.id !== t.id) })}
                style={{ padding: '2px 6px' }}
              >
                Видалити
              </button>
            )}
            {mode === 'edit' && (
              <>
                <button
                  onClick={() => {
                    const idx = level.tasks.findIndex(x => x.id === t.id);
                    if (idx <= 0) return;
                    const arr = [...level.tasks];
                    const [item] = arr.splice(idx, 1);
                    arr.splice(idx - 1, 0, item);
                    onChange({ ...level, tasks: arr });
                  }}
                  style={{ padding: '2px 6px' }}
                >
                  ↑
                </button>
                <button
                  onClick={() => {
                    const idx = level.tasks.findIndex(x => x.id === t.id);
                    if (idx < 0 || idx >= level.tasks.length - 1) return;
                    const arr = [...level.tasks];
                    const [item] = arr.splice(idx, 1);
                    arr.splice(idx + 1, 0, item);
                    onChange({ ...level, tasks: arr });
                  }}
                  style={{ padding: '2px 6px' }}
                >
                  ↓
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {mode === 'edit' && (
        <button onClick={addTask} style={{ marginTop: 6, padding: '6px 10px' }}>+ Завдання</button>
      )}

      <TaskModal
        open={isTaskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        initial={editingTask}
        onSave={(task) => {
          if (editingTask) {
            onChange({
              ...level,
              tasks: level.tasks.map(x => (x.id === task.id ? task : x))
            });
          } else {
            onChange({ ...level, tasks: [...level.tasks, task] });
          }
        }}
      />
    </div>
  );
}

