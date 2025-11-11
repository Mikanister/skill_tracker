import React from 'react';
import { Skill } from '@/types';
import { Modal } from '@/components/Modal';
import { ModalActions } from '@/components/ModalActions';
import type { useFormState } from '@/hooks/useFormState';

type SkillEditModalProps = {
  isOpen: boolean;
  editSkill: Skill | null;
  errors: ReturnType<typeof useFormState<{ name: string; description: string }>>['errors'];
  registerField: ReturnType<typeof useFormState<{ name: string; description: string }>>['registerField'];
  onClose: () => void;
  onSave: () => void;
};

export const SkillEditModal: React.FC<SkillEditModalProps> = ({
  isOpen,
  editSkill,
  errors,
  registerField,
  onClose,
  onSave
}) => (
  <Modal
    open={isOpen}
    onClose={onClose}
    title={editSkill ? 'Редагувати навичку' : 'Нова навичка'}
    width={600}
    footer={(
      <ModalActions
        actions={[
          { label: 'Скасувати', onClick: onClose, variant: 'panel' },
          { label: 'Зберегти', onClick: onSave, variant: 'primary-soft' }
        ]}
      />
    )}
  >
    <div className="skills-modal-grid">
      <label className="labeled-field">
        <span>Назва</span>
        <input {...registerField('name')} className="input-control" />
        {errors.name && (
          <span className="text-xs text-muted" style={{ color: 'var(--danger)' }}>
            {errors.name}
          </span>
        )}
      </label>
      <label className="labeled-field">
        <span>Опис</span>
        <textarea {...registerField('description')} rows={4} className="textarea-control" />
      </label>
    </div>
  </Modal>
);
