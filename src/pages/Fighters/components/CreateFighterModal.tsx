import React from 'react';
import { Category, FighterSkillLevels } from '@/types';
import { Modal } from '@/components/Modal';
import { SegmentedLevelInput } from '@/components/SegmentedLevelInput';
import { ModalActions } from '@/components/ModalActions';

export type FighterDraftForm = {
  fullName: string;
  callsign: string;
  rank: string;
  position: string;
  unit: string;
  notes: string;
};

type LevelValue = 0|1|2|3|4|5|6|7|8|9|10;

type CreateFighterModalProps = {
  open: boolean;
  categories: Category[];
  registerField: <K extends keyof FighterDraftForm>(field: K) => {
    value: FighterDraftForm[K];
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | FighterDraftForm[K]) => void;
    onBlur: () => void;
  };
  errors: Partial<Record<keyof FighterDraftForm, string>>;
  showRankSuggestions: boolean;
  onRankFocus: () => void;
  onRankBlur: () => void;
  onSelectRank: (rank: string) => void;
  rankSuggestions: string[];
  levels: FighterSkillLevels;
  onChangeLevel: (skillId: string, level: LevelValue) => void;
  modalSearch: string;
  onModalSearchChange: (value: string) => void;
  collapsed: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

const ACCENT_CYCLE: Array<'blue' | 'teal' | 'violet'> = ['blue', 'teal', 'violet'];
const LEVEL_VALUES: LevelValue[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const CreateFighterModal: React.FC<CreateFighterModalProps> = ({
  open,
  categories,
  registerField,
  errors,
  showRankSuggestions,
  onRankFocus,
  onRankBlur,
  onSelectRank,
  rankSuggestions,
  levels,
  onChangeLevel,
  modalSearch,
  onModalSearchChange,
  collapsed,
  onToggleCategory,
  onClose,
  onSubmit
}) => {
  const fullNameField = registerField('fullName');
  const callsignField = registerField('callsign');
  const rankField = registerField('rank');
  const positionField = registerField('position');
  const unitField = registerField('unit');
  const notesField = registerField('notes');

  const filteredCategories = React.useMemo(() => {
    const term = modalSearch.trim().toLowerCase();
    if (!term) return categories;
    return categories
      .map(category => ({
        ...category,
        skills: category.skills.filter(skill => skill.name.toLowerCase().includes(term))
      }))
      .filter(category => category.skills.length > 0);
  }, [categories, modalSearch]);

  const firstError = React.useMemo(() => {
    for (const key of Object.keys(errors) as Array<keyof FighterDraftForm>) {
      const message = errors[key];
      if (message) return message;
    }
    return null;
  }, [errors]);

  const rankFilter = String(rankField.value || '').trim().toLowerCase();
  const filteredRankSuggestions = showRankSuggestions
    ? rankSuggestions.filter(option => option.toLowerCase().includes(rankFilter))
    : [];

  const showRankDropdown = showRankSuggestions && filteredRankSuggestions.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Створити бійця"
      width={820}
      footer={(
        <ModalActions
          actions={[
            { label: 'Скасувати', onClick: onClose, variant: 'panel' },
            { label: 'Створити', onClick: onSubmit, variant: 'success-soft' }
          ]}
        />
      )}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {firstError && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--danger-soft-bg)',
            border: '1px solid var(--danger-soft-border)',
            color: 'var(--fg)',
            fontSize: 13,
            boxShadow: 'var(--shadow-sm)'
          }}>
            {firstError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>ПІБ</span>
            <input
              {...fullNameField}
              placeholder="Прізвище Ім'я По батькові"
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
            />
            {errors.fullName && <span style={{ color: 'var(--danger)' }}>{errors.fullName}</span>}
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Позивний</span>
            <input
              {...callsignField}
              placeholder="Позивний"
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
            />
            {errors.callsign && <span style={{ color: 'var(--danger)' }}>{errors.callsign}</span>}
          </label>
          <div style={{ position: 'relative', display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Звання</span>
            <input
              {...rankField}
              onFocus={onRankFocus}
              onBlur={onRankBlur}
              placeholder="Звання"
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
            />
            {showRankDropdown && (
              <ul
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  margin: 0,
                  padding: 8,
                  listStyle: 'none',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-md)',
                  display: 'grid',
                  gap: 4,
                  maxHeight: 220,
                  overflow: 'auto',
                  zIndex: 30
                }}
              >
                {filteredRankSuggestions.map(rank => (
                  <li
                    key={rank}
                    onMouseDown={event => {
                      event.preventDefault();
                      onSelectRank(rank);
                    }}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: 'var(--surface-panel)'
                    }}
                  >
                    {rank}
                  </li>
                ))}
              </ul>
            )}
            {errors.rank && <span style={{ color: 'var(--danger)' }}>{errors.rank}</span>}
          </div>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Посада</span>
            <input
              {...positionField}
              placeholder="Посада"
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
            />
            {errors.position && <span style={{ color: 'var(--danger)' }}>{errors.position}</span>}
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Підрозділ</span>
            <input
              {...unitField}
              placeholder="Підрозділ"
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
            />
            {errors.unit && <span style={{ color: 'var(--danger)' }}>{errors.unit}</span>}
          </label>
          <label style={{ gridColumn: '1 / -1', display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Нотатки</span>
            <textarea
              {...notesField}
              placeholder="Додаткова інформація"
              rows={3}
              style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
            />
          </label>
        </div>

        <input
          placeholder="Пошук скіла"
          value={modalSearch}
          onChange={event => onModalSearchChange(event.target.value)}
          style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
        />

        <div style={{ maxHeight: 420, overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 12, background: 'var(--surface-panel)', display: 'grid', gap: 14 }}>
          {filteredCategories.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
              Навички не знайдено. Змініть пошук.
            </div>
          ) : (
            filteredCategories.map(category => {
              const isCollapsed = collapsed[category.id] ?? false;
              return (
                <div key={category.id} style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{category.name}</div>
                    <button
                      type="button"
                      onClick={() => onToggleCategory(category.id)}
                      style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)', color: 'var(--fg)', fontSize: 12 }}
                    >
                      {isCollapsed ? 'Розгорнути' : 'Згорнути'}
                    </button>
                  </div>
                  {!isCollapsed && (
                    <div className="skill-level-grid">
                      {category.skills.map((skill, index) => {
                        const currentLevel = (levels[skill.id] ?? 0) as LevelValue;
                        const accent = ACCENT_CYCLE[index % ACCENT_CYCLE.length];

                        return (
                          <React.Fragment key={skill.id}>
                            <div className="skill-level-label">{skill.name}</div>
                            <div className="skill-level-control">
                              <SegmentedLevelInput
                                value={currentLevel}
                                onChange={level => onChangeLevel(skill.id, level as LevelValue)}
                                size="sm"
                                accent={accent}
                                maxLevel={LEVEL_VALUES[LEVEL_VALUES.length - 1]}
                              />
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
