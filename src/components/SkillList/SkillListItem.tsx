import React from 'react';
import { Skill } from '@/types';

export type SkillListItemProps = {
  skill: Skill;
  isSelected: boolean;
  onSelect: () => void;
};

export const SkillListItem: React.FC<SkillListItemProps> = ({ skill, isSelected, onSelect }) => (
  <button
    onClick={onSelect}
    style={{
      width: '100%',
      textAlign: 'left',
      padding: '8px 10px',
      marginBottom: 6,
      background: isSelected ? 'var(--accent)' : 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      cursor: 'pointer'
    }}
  >
    {skill.name}
  </button>
);
