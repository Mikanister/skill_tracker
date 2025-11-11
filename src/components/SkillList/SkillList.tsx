import React, { useMemo, useState } from 'react';
import { Category, Skill } from '@/types';
import { SkillListHeader } from './SkillListHeader';
import { SkillListItem } from './SkillListItem';

export type SkillListProps = {
  category?: Category;
  selectedSkillId: string | null;
  onSelect: (skillId: string) => void;
  onCreateSkill: (name: string) => void;
  showArchived?: boolean;
  search?: string;
};

const filterSkills = ({ category, showArchived, search }: Pick<SkillListProps, 'category' | 'showArchived' | 'search'>): Skill[] => {
  const skills = category?.skills ?? [];
  const visible = showArchived ? skills : skills.filter(skill => !skill.isArchived);
  const term = (search ?? '').trim().toLowerCase();
  if (!term) return visible;

  return visible.filter(skill =>
    skill.name.toLowerCase().includes(term) ||
    (skill.tags ?? []).some(tag => tag.toLowerCase().includes(term))
  );
};

export const SkillList: React.FC<SkillListProps> = ({ category, selectedSkillId, onSelect, onCreateSkill, showArchived, search }) => {
  const [draftName, setDraftName] = useState('');
  const skills = useMemo(() => filterSkills({ category, showArchived, search }), [category, showArchived, search]);

  const canCreate = Boolean(category) && draftName.trim().length > 0;

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Скіли</h3>

      <SkillListHeader
        draftName={draftName}
        onDraftChange={setDraftName}
        canCreate={canCreate}
        onCreate={() => {
          const name = draftName.trim();
          if (!name || !category) return;
          onCreateSkill(name);
          setDraftName('');
        }}
      />

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {skills.map(skill => (
          <li key={skill.id}>
            <SkillListItem
              skill={skill}
              isSelected={skill.id === selectedSkillId}
              onSelect={() => onSelect(skill.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
