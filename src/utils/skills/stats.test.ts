import { describe, it, expect } from 'vitest';
import type { Fighter, FighterSkillLevels } from '@/types';
import { buildSkillUsage, calculateSkillStats } from './stats';

describe('utils/skills/stats', () => {
  describe('buildSkillUsage', () => {
    it('aggregates usage counts and max levels across fighters', () => {
      const fighters: Fighter[] = [
        { id: 'f1', name: 'Alpha', unit: '1 ОМБр' },
        { id: 'f2', name: 'Bravo', unit: '2 ОМБр' }
      ];

      const fighterSkillLevels: Record<string, FighterSkillLevels> = {
        f1: { skillA: 3, skillB: 0 },
        f2: { skillA: 5, skillC: 2 }
      };

      const usage = buildSkillUsage(fighters, fighterSkillLevels);

      expect(Array.from(usage.entries())).toEqual([
        ['skillA', { count: 2, maxLevel: 5 }],
        ['skillB', { count: 0, maxLevel: 0 }],
        ['skillC', { count: 1, maxLevel: 2 }]
      ]);
    });

    it('returns empty usage when fighters lack skill data', () => {
      const fighters: Fighter[] = [
        { id: 'f1', name: 'Alpha' }
      ];

      const fighterSkillLevels: Record<string, FighterSkillLevels> = {
        f1: {}
      };

      const usage = buildSkillUsage(fighters, fighterSkillLevels);
      expect(Array.from(usage.entries())).toEqual([]);
    });
  });

  describe('calculateSkillStats', () => {
    it('returns sorted fighters, averages, and unit breakdowns', () => {
      const fighters: Fighter[] = [
        { id: 'f1', name: 'Alpha', unit: '1 ОМБр' },
        { id: 'f2', name: 'Bravo' },
        { id: 'f3', name: 'Charlie', unit: '1 ОМБр' }
      ];

      const fighterSkillLevels: Record<string, FighterSkillLevels> = {
        f1: { skillA: 6 },
        f2: { skillA: 2 },
        f3: { skillA: 4 }
      };

      const stats = calculateSkillStats('skillA', fighters, fighterSkillLevels);

      expect(stats).toEqual({
        fighters: [
          { fighter: fighters[0], level: 6 },
          { fighter: fighters[2], level: 4 },
          { fighter: fighters[1], level: 2 }
        ],
        average: '4.0',
        count: 3,
        byUnit: {
          '1 ОМБр': 2,
          'Без підрозділу': 1
        }
      });
    });

    it('returns zeroed stats when no fighters have the skill', () => {
      const fighters: Fighter[] = [
        { id: 'f1', name: 'Alpha' }
      ];

      const fighterSkillLevels: Record<string, FighterSkillLevels> = {
        f1: { skillA: 0 }
      };

      const stats = calculateSkillStats('skillA', fighters, fighterSkillLevels);

      expect(stats).toEqual({
        fighters: [],
        average: '0.0',
        count: 0,
        byUnit: {}
      });
    });
  });
});
