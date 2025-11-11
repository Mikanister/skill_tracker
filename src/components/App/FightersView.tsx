import React from 'react';
import { Category, Fighter, FighterSkills, FighterSkillLevels } from '@/types';
import { FighterManager } from '@/components/FighterManager';

type FightersViewProps = {
  fighters: Fighter[];
  selectedFighterId: string | null;
  onSelectFighter: (fighterId: string | null) => void;
  onAddFighter: (name: string, initialLevels?: FighterSkillLevels) => void;
  categories: Category[];
  fighterSkills: Record<string, FighterSkills>;
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  onToggleSkillAssignment: (fighterId: string, skillId: string, assigned: boolean) => void;
};

export const FightersView: React.FC<FightersViewProps> = ({
  fighters,
  selectedFighterId,
  onSelectFighter,
  onAddFighter,
  categories,
  fighterSkills,
  fighterSkillLevels,
  onToggleSkillAssignment
}) => (
  <section>
    <FighterManager
      fighters={fighters}
      selectedFighterId={selectedFighterId}
      onSelect={onSelectFighter}
      onAdd={onAddFighter}
      categories={categories}
      fighterSkills={fighterSkills}
      fighterSkillLevels={fighterSkillLevels}
      onToggleSkill={onToggleSkillAssignment}
    />
  </section>
);
