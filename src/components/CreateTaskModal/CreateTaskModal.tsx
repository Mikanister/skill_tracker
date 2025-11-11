import React, { useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { ModalActions } from '@/components/ModalActions';
import { Category, Fighter, FighterSkills, Skill } from '@/types';
import { CreateTaskDetails } from './FormFields';
import { AllowedSkill, SkillSelector } from './SkillSelector';

type CreateTaskPayload = {
  title: string;
  description?: string;
  difficulty?: 1|2|3|4|5;
  links: { skillId: string; categoryId: string; xp: number }[];
};

export type CreateTaskModalProps = {
  open: boolean;
  onClose: () => void;
  fighter?: Fighter;
  categories: Category[];
  fighterSkills: Record<string, FighterSkills>;
  onCreate: (payload: CreateTaskPayload) => void;
};

const DEFAULT_DIFFICULTY: 1|2|3|4|5 = 3;
const MIN_XP = 0;

const buildAllowedSkills = (fighter: Fighter | undefined, fighterSkills: Record<string, FighterSkills>, categories: Category[]): AllowedSkill[] => {
  if (!fighter) return [];
  const assigned = fighterSkills[fighter.id] || {};
  const list: AllowedSkill[] = [];
  categories.forEach(category => {
    category.skills.forEach(skill => {
      if (assigned[skill.id]) {
        list.push({ skill, categoryId: category.id });
      }
    });
  });
  return list;
};

const filterAllowedSkills = (skills: AllowedSkill[], search: string): AllowedSkill[] => {
  const term = search.trim().toLowerCase();
  if (!term) return skills;
  return skills.filter(({ skill }) => skill.name.toLowerCase().includes(term));
};

const INITIAL_SELECTION: Record<string, boolean> = {};

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ open, onClose, fighter, fighterSkills, categories, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [xp, setXp] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<1|2|3|4|5>(DEFAULT_DIFFICULTY);
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>(INITIAL_SELECTION);
  const [error, setError] = useState<string | null>(null);

  const allowedSkills = useMemo(() => buildAllowedSkills(fighter, fighterSkills, categories), [fighter, fighterSkills, categories]);
  const filteredSkills = useMemo(() => filterAllowedSkills(allowedSkills, search), [allowedSkills, search]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setXp(0);
    setDifficulty(DEFAULT_DIFFICULTY);
    setSelectedSkills(INITIAL_SELECTION);
    setSearch('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleToggleSkill = (skillId: string, checked: boolean) => {
    setSelectedSkills(prev => ({ ...prev, [skillId]: checked }));
  };

  const handleSubmit = () => {
    if (!fighter) {
      setError('Оберіть бійця, щоб створити задачу.');
      return;
    }
    if (!title.trim()) {
      setError('Вкажіть назву задачі.');
      return;
    }
    const picked = Object.keys(selectedSkills).filter(id => selectedSkills[id]);
    if (picked.length === 0) {
      setError('Оберіть хоча б одну навичку.');
      return;
    }

    const links = picked.map(skillId => {
      const record = allowedSkills.find(item => item.skill.id === skillId);
      return {
        skillId,
        categoryId: record?.categoryId ?? '',
        xp: Math.max(MIN_XP, Math.round(xp))
      };
    });

    onCreate({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      links
    });

    resetForm();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Нова задача"
      width={760}
      footer={(
        <ModalActions
          actions={[
            { label: 'Скасувати', onClick: handleClose, variant: 'panel' },
            {
              label: 'Створити',
              onClick: handleSubmit,
              variant: 'success-soft'
            }
          ]}
        />
      )}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--danger-soft-border)', background: 'var(--danger-soft-bg)', color: 'var(--fg)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <CreateTaskDetails
            title={title}
            description={description}
            xp={xp}
            difficulty={difficulty}
            onTitleChange={value => {
              setTitle(value);
              if (error) setError(null);
            }}
            onDescriptionChange={setDescription}
            onXpChange={value => {
              setXp(value);
              if (error) setError(null);
            }}
            onDifficultyChange={setDifficulty}
          />

          <SkillSelector
            search={search}
            onSearchChange={setSearch}
            skills={filteredSkills}
            selectedSkills={selectedSkills}
            onToggleSkill={handleToggleSkill}
            categories={categories}
          />
        </div>
      </div>
    </Modal>
  );
};
