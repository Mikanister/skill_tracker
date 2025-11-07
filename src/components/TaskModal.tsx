import { useEffect, useState } from 'react';
import { Task } from '@/types';
import { Modal } from './Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Task;
  onSave: (task: Task) => void;
};

export function TaskModal({ open, onClose, initial, onSave }: Props) {
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<1|2|3|4|5>(3);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setText(initial?.text ?? '');
      setDescription(initial?.description ?? '');
      setDifficulty((initial?.difficulty as 1|2|3|4|5) ?? 3);
      setDone(initial?.done ?? false);
    }
  }, [open, initial]);

  const canSave = text.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Редагувати завдання' : 'Створити завдання'}
      footer={(
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}>Скасувати</button>
          <button
            disabled={!canSave}
            onClick={() => {
              if (!text.trim()) {
                setError('Вкажіть назву задачі.');
                return;
              }
              const base: Task = initial ?? { id: `${Date.now()}`, text: '', done: false };
              const task: Task = { ...base, text: text.trim(), description: description.trim(), difficulty, done };
              onSave(task);
              onClose();
            }}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, boxShadow: 'var(--shadow-sm)', opacity: canSave ? 1 : 0.6 }}
          >
            Зберегти
          </button>
        </div>
      )}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        {error && (
          <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--danger-soft-border)', background: 'var(--danger-soft-bg)', color: 'var(--fg)', fontSize: 13 }}>
            {error}
          </div>
        )}
        <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Назва</span>
          <input value={text} onChange={e => { setText(e.target.value); setError(null); }} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }} />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Опис</span>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)', resize: 'vertical' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Складність</span>
          <select value={difficulty} onChange={e => setDifficulty(Number(e.target.value) as 1|2|3|4|5)} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }}>
            {[1,2,3,4,5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        {initial && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--muted)' }}>
            <input type="checkbox" checked={done} onChange={e => setDone(e.target.checked)} />
            <span>Позначити виконаним</span>
          </label>
        )}
      </div>
    </Modal>
  );
}

