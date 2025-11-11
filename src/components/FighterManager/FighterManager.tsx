import React, { useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Category, Fighter, FighterSkills, FighterSkillLevels } from '@/types';

export type FighterManagerProps = {
  fighters: Fighter[];
  selectedFighterId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (name: string, initialLevels: FighterSkillLevels) => void;
  categories: Category[];
  fighterSkills: Record<string, FighterSkills>;
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  onToggleSkill: (fighterId: string, skillId: string, assigned: boolean) => void;
};

type LevelsMap = FighterSkillLevels;
type LevelValue = LevelsMap[string];

const LEVEL_VALUES: LevelValue[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type FighterSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
};

const FighterSearch: React.FC<FighterSearchProps> = ({ value, onChange, onAdd }) => (
  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder="Ім'я бійця"
      style={{ flex: 1, padding: 8, border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'var(--surface-panel)', color: 'var(--fg)' }}
    />
    <button style={{ padding: '8px 12px' }} onClick={onAdd}>
      Додати
    </button>
  </div>
);

type FighterListProps = {
  fighters: Fighter[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const FighterList: React.FC<FighterListProps> = ({ fighters, selectedId, onSelect }) => (
  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
    {fighters.map(fighter => (
      <li key={fighter.id}>
        <button
          onClick={() => onSelect(fighter.id)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '8px 10px',
            marginBottom: 6,
            background: fighter.id === selectedId ? 'var(--surface-accent-pill)' : 'var(--surface-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6
          }}
        >
          {fighter.name}
        </button>
      </li>
    ))}
  </ul>
);

type AssignedSkillsPanelProps = {
  categories: Category[];
  fighterId: string;
  fighterSkills: Record<string, FighterSkills>;
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  onToggleSkill: (fighterId: string, skillId: string, assigned: boolean) => void;
};

const AssignedSkillsPanel: React.FC<AssignedSkillsPanelProps> = ({ categories, fighterId, fighterSkills, fighterSkillLevels, onToggleSkill }) => (
  <div style={{ marginTop: 12 }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>Призначені скіли та рівні</div>
    {categories.map(category => (
      <div key={category.id} style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{category.name}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8 }}>
          {category.skills.map(skill => {
            const assigned = !!fighterSkills[fighterId]?.[skill.id];
            const level = (fighterSkillLevels[fighterId]?.[skill.id] ?? 0) as 0|1|2|3|4|5|6|7|8|9|10;
            return (
              <React.Fragment key={skill.id}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid var(--border-subtle)',
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: 'var(--surface-panel-alt)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={assigned}
                    onChange={event => onToggleSkill(fighterId, skill.id, event.target.checked)}
                  />
                  {skill.name}
                </label>
                <span style={{ fontSize: 12, padding: '2px 8px', border: '1px solid var(--border-subtle)', borderRadius: 999, color: 'var(--muted)' }}>
                  lvl {level}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

type LevelsModalProps = {
  open: boolean;
  title: string;
  categories: Category[];
  levels: LevelsMap;
  onChange: (skillId: string, level: LevelValue) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const LevelsModal: React.FC<LevelsModalProps> = ({ open, title, categories, levels, onChange, onCancel, onSubmit }) => (
  <Modal open={open} onClose={onCancel} title={title} width={720}>
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ color: 'var(--muted)' }}>
        <>Вкажіть рівні володіння навичками. Рівень 0 означає, що навичка не призначена. Після створення рівні змінюються лише від XP.</>
      </div>
      <div style={{ maxHeight: 420, overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 8, background: 'var(--surface-panel)' }}>
        {categories.map(category => (
          <div key={category.id} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{category.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
              {category.skills.map(skill => (
                <React.Fragment key={skill.id}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>{skill.name}</div>
                  <select
                    value={levels[skill.id] ?? 0}
                    onChange={event => {
                      const nextLevel = Number(event.target.value);
                      if (!LEVEL_VALUES.includes(nextLevel as LevelValue)) return;
                      onChange(skill.id, nextLevel as LevelValue);
                    }}
                    style={{ padding: '4px 6px', width: 70, border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'var(--surface-panel)', color: 'var(--fg)' }}
                  >
                    {LEVEL_VALUES.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel}>Скасувати</button>
        <button style={{ padding: '6px 10px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 6, color: 'var(--fg)' }} onClick={onSubmit}>
          Створити бійця
        </button>
      </div>
    </div>
  </Modal>
);

export const FighterManager: React.FC<FighterManagerProps> = ({
  fighters,
  selectedFighterId,
  onSelect,
  onAdd,
  categories,
  fighterSkills,
  fighterSkillLevels,
  onToggleSkill
}) => {
  const [draftName, setDraftName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [levels, setLevels] = useState<LevelsMap>({});

  const initializedLevels = useMemo(() => {
    const entries: [string, number][] = [];
    for (const category of categories) {
      for (const skill of category.skills) {
        entries.push([skill.id, 0]);
      }
    }
    return Object.fromEntries(entries) as LevelsMap;
  }, [categories]);

  const openCreationModal = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    setLevels(initializedLevels);
    setModalOpen(true);
  };

  const handleCreateFighter = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    onAdd(trimmed, levels);
    setDraftName('');
    setModalOpen(false);
  };

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Бійці</h3>
      <FighterSearch value={draftName} onChange={setDraftName} onAdd={openCreationModal} />
      <FighterList fighters={fighters} selectedId={selectedFighterId} onSelect={onSelect} />
      {selectedFighterId && (
        <AssignedSkillsPanel
          categories={categories}
          fighterId={selectedFighterId}
          fighterSkills={fighterSkills}
          fighterSkillLevels={fighterSkillLevels}
          onToggleSkill={onToggleSkill}
        />
      )}

      <LevelsModal
        open={modalOpen}
        title="Початкові рівні скілів"
        categories={categories}
        levels={levels}
        onChange={(skillId, level) =>
          setLevels(prev => {
            const updated: LevelsMap = { ...prev, [skillId]: level };
            return updated;
          })
        }
        onCancel={() => setModalOpen(false)}
        onSubmit={handleCreateFighter}
      />
    </div>
  );
};
