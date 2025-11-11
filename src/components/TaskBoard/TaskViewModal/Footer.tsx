import React from 'react';
import { ModalActions } from '@/components/ModalActions';

export type TaskViewModalFooterProps = {
  detailsDirty: boolean;
  titleError: boolean;
  deleteLabel: string;
  onSave: () => void;
  onDelete: () => void;
};

export const TaskViewModalFooter: React.FC<TaskViewModalFooterProps> = ({ detailsDirty, titleError, deleteLabel, onSave, onDelete }) => (
  <ModalActions
    start={(
      <button
        className="btn-danger-soft"
        aria-label={deleteLabel}
        onClick={onDelete}
      >
        Видалити задачу
      </button>
    )}
    actions={[
      {
        label: 'Зберегти',
        onClick: onSave,
        variant: 'secondary',
        disabled: !detailsDirty || titleError
      }
    ]}
  />
);
