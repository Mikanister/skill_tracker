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
        <div className="modal-footer-actions">
          <button onClick={onClose} className="btn-panel">Скасувати</button>
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
            className="btn-success-soft"
          >
            Зберегти
          </button>
        </div>
      )}
    >
      <div className="modal-stack">
        {error && (
          <div className="alert-danger-soft" role="alert">
            {error}
          </div>
        )}
        <label className="labeled-field text-sm text-muted">
          <span className="text-strong">Назва</span>
          <input value={text} onChange={e => { setText(e.target.value); setError(null); }} className="input-control input-control--wide" />
        </label>
        <label className="labeled-field text-sm text-muted">
          <span className="text-strong">Опис</span>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="textarea-control" />
        </label>
        <label className="labeled-field labeled-field--inline text-sm text-muted">
          <span className="text-strong">Складність</span>
          <select value={difficulty} onChange={e => setDifficulty(Number(e.target.value) as 1|2|3|4|5)} className="input-control">
            {[1,2,3,4,5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        {initial && (
          <label className="checkbox-inline text-sm text-muted">
            <input type="checkbox" checked={done} onChange={e => setDone(e.target.checked)} />
            <span>Позначити виконаним</span>
          </label>
        )}
      </div>
    </Modal>
  );
}

