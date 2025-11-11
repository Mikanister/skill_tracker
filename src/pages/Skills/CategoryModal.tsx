import React from 'react';
import { Category } from '@/types';
import { Modal } from '@/components/Modal';
import { ModalActions } from '@/components/ModalActions';

type CategoryModalProps = {
  open: boolean;
  category: Category | null;
  name: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  category,
  name,
  onNameChange,
  onClose,
  onSave,
  onDelete
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title={category ? 'Редагувати категорію' : 'Нова категорія'}
    width={500}
    footer={(
      <ModalActions
        start={category ? (
          <button onClick={onDelete} className="btn-danger-soft">
            Видалити категорію
          </button>
        ) : undefined}
        actions={[
          { label: 'Скасувати', onClick: onClose, variant: 'panel' },
          { label: 'Зберегти', onClick: onSave, variant: 'primary-soft' }
        ]}
      />
    )}
  >
    <div className="skills-modal-grid">
      <label className="labeled-field">
        <span>Назва категорії</span>
        <input value={name} onChange={event => onNameChange(event.target.value)} className="input-control" />
      </label>
    </div>
  </Modal>
);
