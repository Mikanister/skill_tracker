import { Fighter, FighterSkillLevels } from '@/types';

export type SkillUsage = Map<string, { count: number; maxLevel: number }>;

export const buildSkillUsage = (
  fighters: Fighter[],
  fighterSkillLevels: Record<string, FighterSkillLevels>
): SkillUsage => {
  const usage = new Map<string, { count: number; maxLevel: number }>();

  fighters.forEach(fighter => {
    const levels = fighterSkillLevels[fighter.id] || {};
    Object.entries(levels).forEach(([skillId, level]) => {
      const lvl = Number(level) || 0;
      if (!usage.has(skillId)) usage.set(skillId, { count: 0, maxLevel: 0 });
      if (lvl > 0) {
        const entry = usage.get(skillId)!;
        entry.count += 1;
        entry.maxLevel = Math.max(entry.maxLevel, lvl);
      }
    });
  });

  return usage;
};

export type SkillStats = {
  fighters: Array<{ fighter: Fighter; level: number }>;
  average: string;
  count: number;
  byUnit: Record<string, number>;
};

export const calculateSkillStats = (
  skillId: string,
  fighters: Fighter[],
  fighterSkillLevels: Record<string, FighterSkillLevels>
): SkillStats => {
  const fightersWithSkill = fighters
    .map(fighter => ({
      fighter,
      level: Number(fighterSkillLevels[fighter.id]?.[skillId] ?? 0)
    }))
    .filter(entry => entry.level > 0)
    .sort((a, b) => b.level - a.level);

  const totalLevels = fightersWithSkill.reduce((sum, entry) => sum + entry.level, 0);
  const average = fightersWithSkill.length ? (totalLevels / fightersWithSkill.length).toFixed(1) : '0.0';

  const byUnit = fightersWithSkill.reduce<Record<string, number>>((acc, entry) => {
    const unit = (entry.fighter.unit || 'Без підрозділу').trim();
    acc[unit] = (acc[unit] ?? 0) + 1;
    return acc;
  }, {});

  return {
    fighters: fightersWithSkill,
    average,
    count: fightersWithSkill.length,
    byUnit
  };
};
