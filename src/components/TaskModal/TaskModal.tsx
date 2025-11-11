import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { ModalActions } from '@/components/ModalActions';
import { Task } from '@/types';
import { TaskFormFields } from './FormFields';

export type TaskModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: Task;
  onSave: (task: Task) => void;
};

const DEFAULT_DIFFICULTY: 1|2|3|4|5 = 3;

const buildInitialTask = (initial?: Task): Task => initial ?? { id: `${Date.now()}`, text: '', done: false };

const normalizeDifficulty = (value?: Task['difficulty']): 1|2|3|4|5 => (value as 1|2|3|4|5) ?? DEFAULT_DIFFICULTY;

const isValidTitle = (value: string) => value.trim().length > 0;

export const TaskModal: React.FC<TaskModalProps> = ({ open, onClose, initial, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<1|2|3|4|5>(DEFAULT_DIFFICULTY);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canToggleDone = useMemo(() => Boolean(initial), [initial]);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.text ?? '');
    setDescription(initial?.description ?? '');
    setDifficulty(normalizeDifficulty(initial?.difficulty));
    setDone(initial?.done ?? false);
    setError(null);
  }, [open, initial]);

  const handleSave = () => {
    if (!isValidTitle(title)) {
      setError('Вкажіть назву задачі.');
      return;
    }

    const base = buildInitialTask(initial);
    const task: Task = {
      ...base,
      text: title.trim(),
      description: description.trim(),
      difficulty,
      done
    };

    onSave(task);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Редагувати завдання' : 'Створити завдання'}
      footer={(
        <ModalActions
          actions={[
            { label: 'Скасувати', onClick: onClose, variant: 'panel' },
            { label: 'Зберегти', onClick: handleSave, variant: 'success-soft', disabled: !isValidTitle(title) }
          ]}
        />
      )}
    >
      <TaskFormFields
        title={title}
        description={description}
        difficulty={difficulty}
        done={done}
        canToggleDone={canToggleDone}
        error={error}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onDifficultyChange={setDifficulty}
        onDoneChange={setDone}
        onClearError={() => setError(null)}
      />
    </Modal>
  );
};
