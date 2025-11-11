import React from 'react';
import { FighterSkillLevels, FighterSkills } from '@/types';

type FighterAssignmentProps = {
  skillId: string;
  selectedFighterId?: string | null;
  fighterSkills?: Record<string, FighterSkills>;
  fighterSkillLevels?: Record<string, FighterSkillLevels>;
  onToggleSkill?: (fighterId: string, skillId: string, assigned: boolean) => void;
};

export const FighterAssignment: React.FC<FighterAssignmentProps> = ({
  skillId,
  selectedFighterId,
  fighterSkills,
  fighterSkillLevels,
  onToggleSkill
}) => {
  if (!selectedFighterId) return null;

  const assigned = !!fighterSkills?.[selectedFighterId]?.[skillId];
  const level = fighterSkillLevels?.[selectedFighterId]?.[skillId] ?? 0;

  return (
    <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', border: '1px dashed var(--border)', borderRadius: 8 }}>
      <strong>Рівень бійця</strong>
      <span style={{ fontSize: 12, padding: '2px 8px', border: '1px solid var(--border)', borderRadius: 999, background: 'var(--panel)' }}>
        lvl {level}
      </span>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="checkbox"
          checked={assigned}
          onChange={event => {
            const checked = event.target.checked;
            onToggleSkill?.(selectedFighterId, skillId, checked);
          }}
        />
        Призначено
      </label>
    </div>
  );
};
