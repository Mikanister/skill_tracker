import React from 'react';
import { Skill, Fighter } from '@/types';
import { Modal } from '@/components/Modal';
import { ModalActions } from '@/components/ModalActions';
import type { useFormState } from '@/hooks/useFormState';
import type { SkillStats } from '@/utils/skills';

type SkillViewModalProps = {
  isOpen: boolean;
  viewSkill: Skill | null;
  values: ReturnType<typeof useFormState<{ name: string; description: string }>>['values'];
  errors: ReturnType<typeof useFormState<{ name: string; description: string }>>['errors'];
  registerField: ReturnType<typeof useFormState<{ name: string; description: string }>>['registerField'];
  stats: SkillStats | null;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
};

export const SkillViewModal: React.FC<SkillViewModalProps> = ({
  isOpen,
  viewSkill,
  values,
  errors,
  registerField,
  stats,
  onClose,
  onDelete,
  onSave
}) => (
  <Modal
    open={isOpen}
    onClose={onClose}
    title={`Навичка: ${values.name || viewSkill?.name || ''}`}
    width={720}
    footer={viewSkill ? (
      <ModalActions
        start={(
          <button onClick={onDelete} className="btn-danger-soft">
            Видалити
          </button>
        )}
        actions={[
          { label: 'Зберегти', onClick: onSave, variant: 'primary' }
        ]}
      />
    ) : undefined}
  >
    {viewSkill && (
      <div className="skills-modal-grid">
        <label className="labeled-field">
          <span className="text-xs text-muted">Назва</span>
          <input {...registerField('name')} className="input-control" />
          {errors.name && (
            <span className="text-xs text-muted" style={{ color: 'var(--danger)' }}>
              {errors.name}
            </span>
          )}
        </label>
        <label className="labeled-field">
          <span className="text-xs text-muted">Опис</span>
          <textarea {...registerField('description')} rows={4} className="textarea-control" />
        </label>
        {stats && (
          <div className="modal-stack">
            <div className="skills-stats-cards">
              <div className="skills-stats-card">
                <div className="text-xs text-muted">Бійців володіє</div>
                <div className="text-lg text-strong">{stats.count}</div>
              </div>
              <div className="skills-stats-card">
                <div className="text-xs text-muted">Середній рівень</div>
                <div className="text-lg text-strong">{stats.average}</div>
              </div>
            </div>
            <div>
              <strong className="section-title">Розподіл за підрозділами</strong>
              <div className="skills-distribution">
                {(Object.entries(stats.byUnit) as Array<[string, number]>).map(([unit, count]) => (
                  <span key={unit} className="chip">
                    {unit}: {count}
                  </span>
                ))}
                {Object.keys(stats.byUnit).length === 0 && (
                  <span className="text-xs text-muted">Поки що немає даних</span>
                )}
              </div>
            </div>
            <div>
              <strong className="section-title">Бійці</strong>
              {stats.fighters.length === 0 ? (
                <div className="text-xs text-muted" style={{ marginTop: 6 }}>
                  Ніхто не володіє цією навичкою.
                </div>
              ) : (
                <table className="table-muted">
                  <thead>
                    <tr>
                      <th>Боєць</th>
                      <th>Підрозділ</th>
                      <th>Рівень</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.fighters.map(({ fighter, level }: { fighter: Fighter; level: number }) => (
                      <tr key={fighter.id}>
                        <td>{fighter.callsign || fighter.name}</td>
                        <td>{fighter.unit || '—'}</td>
                        <td>lvl {level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    )}
  </Modal>
);
