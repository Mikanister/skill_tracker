import React from 'react';
import clsx from 'clsx';
import { Category, Fighter, FighterSkillLevels, TaskV2 } from '@/types';
import { repetitionFactorFromTasks } from '@/utils';

export type AssigneeSkills = Record<string, Record<string, number>>;

export type SkillBoardProps = {
  categories: Category[];
  selectedFighters: Fighter[];
  assigneeSkills: AssigneeSkills;
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  tasks: TaskV2[];
  difficulty: 1|2|3|4|5;
  title: string;
  onToggleSkill: (fighterId: string, skillId: string, checked: boolean) => void;
  onSetSkillXp: (fighterId: string, skillId: string, value: number) => void;
  allFightersCount: number;
};

export const SkillBoard: React.FC<SkillBoardProps> = ({
  categories,
  selectedFighters,
  assigneeSkills,
  fighterSkillLevels,
  tasks,
  difficulty,
  title,
  onToggleSkill,
  onSetSkillXp,
  allFightersCount
}) => (
  <section className="multiassign-section">
    <strong className="text-md text-strong">Скіли та XP по кожному бійцю</strong>
    <div className="multiassign-skills-board">
      {selectedFighters.map(fighter => (
        <div key={fighter.id} className="multiassign-card">
          <div className="multiassign-card-header">
            <div className="text-md text-strong">{fighter.callsign || fighter.fullName || fighter.name}</div>
            <div className="multiassign-card-count">{Object.keys(assigneeSkills[fighter.id] ?? {}).length} навичок</div>
          </div>
          {categories.map(category => (
            <div key={category.id} className="multiassign-category">
              <div className="multiassign-category-title">{category.name}</div>
              <div className="multiassign-skill-list">
                {category.skills.map(skill => {
                  const skillLevel = fighterSkillLevels[fighter.id]?.[skill.id] ?? 0;
                  const checked = !!assigneeSkills[fighter.id]?.[skill.id];
                  const repetition = repetitionFactorFromTasks(tasks, {
                    fighterId: fighter.id,
                    skillId: skill.id,
                    difficulty,
                    title
                  });

                  return (
                    <div key={skill.id} className={clsx('multiassign-skill-line', { 'is-selected': checked })}>
                      <div className="multiassign-skill-title">
                        <input
                          type="checkbox"
                          aria-label={skill.name}
                          checked={checked}
                          onChange={event => onToggleSkill(fighter.id, skill.id, event.target.checked)}
                        />
                        <span className="text-sm text-strong">{skill.name}</span>
                      </div>
                      {checked ? (
                        <div className="multiassign-skill-controls">
                          <input
                            type="number"
                            value={assigneeSkills[fighter.id]?.[skill.id] ?? 0}
                            onChange={event => onSetSkillXp(fighter.id, skill.id, Number(event.target.value))}
                            className="input-number-sm"
                          />
                          <span title={`Анти-експлойт: ${repetition.count} схожих за ${3} дні`} className="text-xs text-muted">
                            −{Math.round((1 - repetition.factor) * 100)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">lvl {skillLevel}</span>
                      )}
                      <div className="text-xs text-muted" style={{ justifySelf: 'end' }}>
                        {checked ? `${assigneeSkills[fighter.id]?.[skill.id] ?? 0} XP` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {allFightersCount > 0 && selectedFighters.length === 0 && (
        <div className="empty-hint">Додайте хоча б одного виконавця, щоб призначати навички.</div>
      )}
    </div>
  </section>
);
