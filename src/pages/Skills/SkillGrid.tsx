import React from 'react';
import clsx from 'clsx';
import { Skill } from '@/types';
import { SkillUsage } from '@/utils/skills';

type SkillGridProps = {
  skills: Skill[];
  skillUsage: SkillUsage;
  draggedSkillId: string | null;
  onDragStart: (skillId: string) => void;
  onDragEnd: () => void;
  onOpenSkill: (skill: Skill) => void;
  onAddSkill: () => void;
};

export const SkillGrid: React.FC<SkillGridProps> = ({
  skills,
  skillUsage,
  draggedSkillId,
  onDragStart,
  onDragEnd,
  onOpenSkill,
  onAddSkill
}) => (
  <div className="skills-grid">
    {skills.length === 0 && (
      <div className="skills-empty-card">
        <strong className="skills-empty-title">У цій категорії поки немає навичок</strong>
        <span>Додайте першу навичку або скористайтесь пошуком.</span>
        <button onClick={onAddSkill} data-testid="empty-add-skill" className="btn-primary">
          + Додати навичку
        </button>
      </div>
    )}

    {skills.map(skill => {
      const usage = skillUsage.get(skill.id) || { count: 0, maxLevel: 0 };
      return (
        <article
          key={skill.id}
          draggable
          onDragStart={() => onDragStart(skill.id)}
          onDragEnd={onDragEnd}
          className={clsx('skill-card', { 'is-dragging': draggedSkillId === skill.id })}
          onClick={() => onOpenSkill(skill)}
          role="button"
          tabIndex={0}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onOpenSkill(skill);
            }
          }}
        >
          <div className="flex-row align-center gap-12" style={{ flexWrap: 'wrap' }}>
            <strong className="skill-card-title">{skill.name}</strong>
          </div>
          {skill.description && <div className="skill-card-description">{skill.description}</div>}
          <div className="flex-row gap-8" style={{ fontSize: 11, color: 'var(--muted)' }}>
            <span className="chip">Бійців: {usage.count}</span>
            {usage.maxLevel > 0 && <span className="chip chip--accent">Макс. рівень {usage.maxLevel}</span>}
          </div>
        </article>
      );
    })}
  </div>
);
