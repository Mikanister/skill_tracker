import { describe, it, expect } from 'vitest';
import type { SkillTree, FighterSkillLevels } from '@/types';
import {
  isFighter,
  isTasksV2Array,
  parseFighters,
  parseTasksV2,
  parseSkillTree,
  parseFighterXpLedger,
  parseFighterSkillLevels,
  parseFighterSkills
} from './storageAdapters';

describe('storageAdapters', () => {
  it('isFighter validates minimal fighter shape', () => {
    expect(isFighter({ id: 'f1', name: 'Alpha' })).toBe(true);
    expect(isFighter({ id: 123, name: 'Alpha' })).toBe(false);
    expect(isFighter(null)).toBe(false);
  });

  it('isTasksV2Array checks collection shape', () => {
    expect(isTasksV2Array([{ id: 't1', title: 'Task', assignees: [] }])).toBe(true);
    expect(isTasksV2Array([{ id: 't2', title: 123, assignees: [] }])).toBe(false);
  });

  it('parseFighters returns fallback for invalid payloads', () => {
    const fallback = [{ id: 'fallback', name: 'Fallback' }];
    expect(parseFighters([{ id: 'ok', name: 'Ok' }], fallback)).toEqual([{ id: 'ok', name: 'Ok' }]);
    expect(parseFighters([{ id: 1 }], fallback)).toEqual(fallback);
  });

  it('parseTasksV2 handles malformed entries', () => {
    const fallback: any[] = [];
    const valid = [{ id: 't1', title: 'Task', assignees: [] }];
    expect(parseTasksV2(valid, fallback)).toEqual(valid);
    expect(parseTasksV2([{ id: 't2', title: 1, assignees: [] }], fallback)).toBe(fallback);
  });

  it('parseSkillTree enforces structure', () => {
    const fallback: SkillTree = { categories: [], version: 1 };
    const valid: SkillTree = { categories: [], version: 2 };
    expect(parseSkillTree(valid, fallback)).toEqual(valid);
    expect(parseSkillTree(null, fallback)).toBe(fallback);
  });

  it('parseFighterXpLedger validates numeric records', () => {
    const fallback = {} as Record<string, Record<string, number>>;
    const valid = { f1: { s1: 10, s2: 0 } };
    expect(parseFighterXpLedger(valid, fallback)).toEqual(valid);
    expect(parseFighterXpLedger({ f1: { s1: 'oops' } }, fallback)).toBe(fallback);
  });

  it('parseFighterSkillLevels validates bounded integers', () => {
    const fallback: Record<string, FighterSkillLevels> = {};
    const valid: Record<string, FighterSkillLevels> = { f1: { s1: 0, s2: 10 } };
    expect(parseFighterSkillLevels(valid, fallback)).toEqual(valid);
    expect(parseFighterSkillLevels({ f1: { s1: 11 } }, fallback)).toBe(fallback);
  });

  it('parseFighterSkills validates boolean flags', () => {
    const fallback = {} as Record<string, Record<string, boolean>>;
    const valid = { f1: { s1: true, s2: false } };
    expect(parseFighterSkills(valid, fallback)).toEqual(valid);
    expect(parseFighterSkills({ f1: { s1: 'yes' } }, fallback)).toBe(fallback);
  });
});
