import { Category, Skill } from '@/types';

export type SkillProgress = {
  total: number;
  done: number;
  pct: number;
};

export function getSkillProgress(skill: Skill): SkillProgress {
  const total = skill.levels.reduce((acc, level) => acc + level.tasks.length, 0);
  const done = skill.levels.reduce(
    (acc, level) => acc + level.tasks.filter(task => task.done).length,
    0
  );
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

export type CategoryProgress = SkillProgress;

export function getCategoryProgress(category: Category): CategoryProgress {
  const skills = category.skills.filter(skill => !skill.isArchived);
  if (skills.length === 0) {
    return { total: 0, done: 0, pct: 0 };
  }
  const totals = skills.map(getSkillProgress);
  const total = totals.reduce((sum, item) => sum + item.total, 0);
  const done = totals.reduce((sum, item) => sum + item.done, 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}
