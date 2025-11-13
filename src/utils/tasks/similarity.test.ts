import { describe, it, expect, vi, afterEach } from 'vitest';
import type { TaskV2 } from '@/types';
import { tokenize, jaccard, countSimilarForTaskLine, repetitionFactorFromTasks } from './similarity';

describe('utils/tasks/similarity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('tokenize', () => {
    it('normalizes text and filters short tokens', () => {
      expect(tokenize('Rapid, Response! Звіт-42?')).toEqual(new Set(['rapid', 'response', 'звіт']));
    });
  });

  describe('jaccard', () => {
    it('returns 1 for identical sets and handles empty sets', () => {
      expect(jaccard(new Set(['alpha', 'bravo']), new Set(['bravo', 'alpha']))).toBe(1);
      expect(jaccard(new Set(), new Set())).toBe(1);
    });

    it('computes similarity proportion', () => {
      expect(jaccard(new Set(['alpha', 'bravo']), new Set(['bravo', 'charlie']))).toBeCloseTo(1 / 3, 5);
    });
  });

  const baseTask = (overrides: Partial<TaskV2>): TaskV2 => ({
    id: 't-' + Math.random().toString(36).slice(2),
    title: 'Base task',
    description: '',
    difficulty: 3,
    status: 'done',
    createdAt: Date.now(),
    assignees: [],
    ...overrides
  });

  describe('countSimilarForTaskLine', () => {
    it('counts tasks within window, same fighter/skill, similar title and difficulty', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const tasks: TaskV2[] = [
        baseTask({
          title: 'Night recon patrol',
          approvedAt: now - 1 * 86_400_000,
          assignees: [{ fighterId: 'f1', skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 5 }] }]
        }),
        baseTask({
          title: 'Night recon patrol 2',
          approvedAt: now - 2 * 86_400_000,
          assignees: [{ fighterId: 'f1', skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 5 }] }]
        }),
        baseTask({
          title: 'Engineering task',
          approvedAt: now - 1 * 86_400_000,
          difficulty: 1,
          assignees: [{ fighterId: 'f1', skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 5 }] }]
        }),
        baseTask({
          title: 'Night recon patrol',
          approvedAt: now - 5 * 86_400_000,
          assignees: [{ fighterId: 'f1', skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 5 }] }]
        }),
        baseTask({
          title: 'Night recon patrol',
          approvedAt: now - 1 * 86_400_000,
          assignees: [{ fighterId: 'f2', skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 5 }] }]
        })
      ];

      const count = countSimilarForTaskLine(tasks, {
        fighterId: 'f1',
        skillId: 's1',
        difficulty: 3,
        title: 'Night reconnaissance patrol',
        windowDays: 3
      });

      expect(count).toBe(2);
    });
  });

  describe('repetitionFactorFromTasks', () => {
    it('uses diminishing returns based on similar count', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const tasks: TaskV2[] = [
        baseTask({
          title: 'Night recon patrol',
          approvedAt: now - 1 * 86_400_000,
          assignees: [{ fighterId: 'f1', skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 5 }] }]
        }),
        baseTask({
          title: 'Night recon patrol 2',
          approvedAt: now - 2 * 86_400_000,
          assignees: [{ fighterId: 'f1', skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 5 }] }]
        }),
        baseTask({
          title: 'Night recon patrol 3',
          approvedAt: now - 3 * 86_400_000,
          assignees: [{ fighterId: 'f1', skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 5 }] }]
        }),
        baseTask({
          title: 'Night recon patrol 4',
          approvedAt: now - 4 * 86_400_000,
          assignees: [{ fighterId: 'f1', skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 5 }] }]
        })
      ];

      const { count, factor } = repetitionFactorFromTasks(tasks, {
        fighterId: 'f1',
        skillId: 's1',
        difficulty: 3,
        title: 'Night recon patrol',
        windowDays: 3,
        freeQuota: 2,
        step: 0.2,
        minFactor: 0.4
      });

      expect(count).toBe(3);
      expect(factor).toBeCloseTo(0.8, 2);
    });
  });
});
