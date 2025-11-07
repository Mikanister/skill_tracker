import { describe, it, expect } from 'vitest';
import { levelFromXp, xpThresholdForLevel, BASE_XP_BY_DIFFICULTY, clampModifier, computeSuggestedXp, tokenize, jaccard, countSimilarForTaskLine, repetitionFactorFromTasks } from './utils';
import type { TaskV2 } from './types';

describe('XP thresholds and levels', () => {
  const thresholds = [0,40,120,240,400,600,900,1300,1800,2400,3000];
  it('xpThresholdForLevel returns thresholds', () => {
    thresholds.forEach((xp, lvl) => expect(xpThresholdForLevel(lvl as any)).toBe(xp));
  });
  it('levelFromXp maps correctly', () => {
    expect(levelFromXp(0)).toBe(0);
    expect(levelFromXp(39)).toBe(0);
    expect(levelFromXp(40)).toBe(1);
    expect(levelFromXp(599)).toBe(4);
    expect(levelFromXp(600)).toBe(5);
    expect(levelFromXp(3000)).toBe(10);
    expect(levelFromXp(9999)).toBe(10);
  });
});

describe('Base XP and modifiers', () => {
  it('BASE_XP_BY_DIFFICULTY sanity', () => {
    expect(BASE_XP_BY_DIFFICULTY[1]).toBe(5);
    expect(BASE_XP_BY_DIFFICULTY[5]).toBe(25);
  });
  it('clampModifier', () => {
    expect(clampModifier(0.1)).toBeCloseTo(0.7);
    expect(clampModifier(2)).toBeCloseTo(1.4);
    expect(clampModifier(1.2)).toBeCloseTo(1.2);
  });
  it('computeSuggestedXp with novice and repetition', () => {
    const xp1 = computeSuggestedXp({ difficulty: 3, isNovice: true, repetitionCount: 1 });
    const xpMany = computeSuggestedXp({ difficulty: 3, isNovice: true, repetitionCount: 6 });
    expect(xp1).toBeGreaterThan(xpMany);
  });
});

describe('Anti-exploit similarity', () => {
  const mkTask = (title: string, difficulty: 1|2|3|4|5, ts: number, fighterId='f1', skillId='s1'): TaskV2 => ({
    id: Math.random().toString(36).slice(2),
    title,
    description: '',
    difficulty,
    assignees: [{ fighterId, skills: [{ skillId, categoryId: 'c1', xpSuggested: 5, xpApproved: 5 }] }],
    status: 'done',
    createdAt: ts,
    submittedAt: ts,
    approvedAt: ts
  });

  it('tokenize/jaccard basic', () => {
    const a = tokenize('Test repair drone');
    const b = tokenize('Drone quick repair');
    const sim = jaccard(a, b);
    expect(sim).toBeGreaterThan(0.3);
  });

  it('countSimilarForTaskLine counts within window and close difficulty', () => {
    const now = Date.now();
    const tasks: TaskV2[] = [
      mkTask('Fix motor A', 3, now - 1 * 86400000),
      mkTask('Fix motor B', 4, now - 2 * 86400000),
      mkTask('Assemble frame', 5, now - 10 * 86400000) // out of window
    ];
    const count = countSimilarForTaskLine(tasks, { fighterId: 'f1', skillId: 's1', difficulty: 3, title: 'Fix motor C', windowDays: 3 });
    expect(count).toBe(2);
  });

  it('repetitionFactorFromTasks diminishes', () => {
    const now = Date.now();
    const tasks: TaskV2[] = [mkTask('Fix motor', 3, now - 1 * 86400000), mkTask('Fix motor', 3, now - 2 * 86400000), mkTask('Fix motor', 3, now - 3 * 86400000), mkTask('Fix motor', 3, now - 4 * 86400000)];
    const { count, factor } = repetitionFactorFromTasks(tasks, { fighterId: 'f1', skillId: 's1', difficulty: 3, title: 'Fix motor', windowDays: 7, freeQuota: 3, step: 0.1 });
    expect(count).toBeGreaterThanOrEqual(4);
    expect(factor).toBeLessThan(1);
    expect(factor).toBeGreaterThan(0.4);
  });
});
