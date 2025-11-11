import React from 'react';
import { Mode, Skill, FighterSkills, FighterSkillLevels } from '@/types';
import { getSkillProgress } from '@/utils';
import { LevelEditor } from '@/components/LevelEditor';
import { SkillDetailHeader } from './SkillDetailHeader';
import { FighterAssignment } from './FighterAssignment';
import { TagsSection } from './TagsSection';

export type SkillDetailProps = {
  skill?: Skill;
  mode: Mode;
  onChange: (skill: Skill) => void;
  onDelete: (skillId: string) => void;
  selectedFighterId?: string | null;
  fighterSkills?: Record<string, FighterSkills>;
  fighterSkillLevels?: Record<string, FighterSkillLevels>;
  onToggleSkill?: (fighterId: string, skillId: string, assigned: boolean) => void;
};

export const SkillDetail: React.FC<SkillDetailProps> = ({
  skill,
  mode,
  onChange,
  onDelete,
  selectedFighterId,
  fighterSkills,
  fighterSkillLevels,
  onToggleSkill
}) => {
  if (!skill) {
    return <div style={{ padding: 12 }}>Виберіть скіл</div>;
  }

  const progress = getSkillProgress(skill);

  const handleToggleArchive = () => onChange({ ...skill, isArchived: !skill.isArchived });

  const handleClone = () => {
    const clone: Skill = {
      ...skill,
      id: `${Date.now()}`,
      name: `${skill.name} (копія)`,
      updatedAt: Date.now()
    };
    onChange(clone);
  };

  const handleLevelChange = (updatedLevel: Skill['levels'][number]) => {
    const levels = skill.levels.map(level => (level.level === updatedLevel.level ? updatedLevel : level));
    onChange({ ...skill, levels });
  };

  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SkillDetailHeader
        skill={skill}
        mode={mode}
        progress={progress}
        onToggleArchive={handleToggleArchive}
        onClone={handleClone}
        onDelete={() => onDelete(skill.id)}
      />

      <FighterAssignment
        skillId={skill.id}
        selectedFighterId={selectedFighterId}
        fighterSkills={fighterSkills}
        fighterSkillLevels={fighterSkillLevels}
        onToggleSkill={onToggleSkill}
      />

      <textarea
        placeholder="Опис скілу"
        value={skill.description ?? ''}
        onChange={event => onChange({ ...skill, description: event.target.value })}
        readOnly={mode !== 'edit'}
        style={{ marginTop: 8, padding: 8, borderRadius: 6, resize: 'vertical', minHeight: 60 }}
      />

      <TagsSection skill={skill} mode={mode} onChange={onChange} />

      <div style={{ marginTop: 12, overflow: 'auto' }}>
        {skill.levels.map(level => (
          <LevelEditor
            key={level.level}
            level={level}
            mode={mode}
            onChange={handleLevelChange}
          />
        ))}
      </div>
    </div>
  );
};
