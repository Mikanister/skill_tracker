import { describe, it, expect } from 'vitest';
import type { Skill, Category, Level, Task } from '@/types';
import { getSkillProgress, getCategoryProgress } from './progress';

const makeTask = (overrides: Partial<Task>): Task => ({
  id: 'task-' + Math.random().toString(36).slice(2),
  text: overrides.text ?? 'Task',
  done: overrides.done ?? false,
  description: overrides.description,
  difficulty: overrides.difficulty
});

const makeLevel = (tasks: Task[]): Level => ({
  level: 1,
  title: 'Level',
  tasks
});

describe('utils/skills/progress', () => {
  it('calculates skill totals and completion percentage', () => {
    const skill: Skill = {
      id: 's1',
      name: 'Skill',
      levels: [
        makeLevel([
          makeTask({ done: true }),
          makeTask({ done: false })
        ]),
        makeLevel([
          makeTask({ done: true }),
          makeTask({ done: true })
        ])
      ]
    };

    const result = getSkillProgress(skill);

    expect(result).toEqual({ total: 4, done: 3, pct: 75 });
  });

  it('returns zero progress when skill has no tasks', () => {
    const emptySkill: Skill = {
      id: 'empty',
      name: 'Empty',
      levels: [makeLevel([])]
    };

    expect(getSkillProgress(emptySkill)).toEqual({ total: 0, done: 0, pct: 0 });
  });

  it('aggregates category progress excluding archived skills', () => {
    const activeSkill: Skill = {
      id: 'active',
      name: 'Active',
      levels: [makeLevel([makeTask({ done: true }), makeTask({ done: false })])]
    };
    const archivedSkill: Skill = {
      id: 'archived',
      name: 'Archived',
      isArchived: true,
      levels: [makeLevel([makeTask({ done: true }), makeTask({ done: true })])]
    };

    const category: Category = {
      id: 'cat',
      name: 'Category',
      skills: [activeSkill, archivedSkill]
    };

    const progress = getCategoryProgress(category);

    expect(progress).toEqual({ total: 2, done: 1, pct: 50 });
  });

  it('handles categories where every skill is archived', () => {
    const category: Category = {
      id: 'cat-archived',
      name: 'Category',
      skills: [{
        id: 'archived',
        name: 'Archived',
        isArchived: true,
        levels: [makeLevel([makeTask({ done: true })])]
      }]
    };

    expect(getCategoryProgress(category)).toEqual({ total: 0, done: 0, pct: 0 });
  });
});
