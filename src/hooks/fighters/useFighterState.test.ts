import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFighterState, type UseFighterStateArgs } from './useFighterState';
import type { SkillTree, Fighter } from '@/types';

vi.mock('@/lib/storage', () => {
  return {
    safeGetItem: vi.fn((key: string, fallback: any) => fallback),
    safeSetItem: vi.fn(),
    generateId: vi.fn((prefix: string) => `${prefix}-id`)
  };
});

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<any>('@/utils');
  return {
    ...actual,
    levelFromXp: vi.fn((xp: number) => {
      if (xp >= 20) return 3;
      if (xp >= 10) return 2;
      if (xp > 0) return 1;
      return 0;
    }),
    xpThresholdForLevel: vi.fn((level: number) => level * 10)
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

const buildTree = (): SkillTree => ({
  version: 1,
  categories: [
    {
      id: 'cat-1',
      name: 'Support',
      skills: [
        {
          id: 'skill-1',
          name: 'Medical',
          levels: []
        },
        {
          id: 'skill-2',
          name: 'Navigation',
          levels: []
        }
      ]
    }
  ]
});

describe('useFighterState', () => {
  const tree = buildTree();

  const createArgs = (): UseFighterStateArgs => ({
    tree,
    undoManager: { push: vi.fn() } as any,
    onRemoveFighterAssignments: vi.fn()
  });

  it('adds fighter with initial levels and seeds xp ledger from thresholds', () => {
    const args = createArgs();
    const { result } = renderHook(props => useFighterState(props), { initialProps: args });

    act(() => {
      result.current.addFighter('Alpha', { 'skill-1': 2 as any }, { callsign: 'AL' });
    });

    const fighters = result.current.fighters;
    expect(fighters).toHaveLength(1);
    const fighter: Fighter = fighters[0];
    expect(fighter.id).toBe('fighter-id');
    expect(fighter.name).toBe('Alpha');
    expect(fighter.callsign).toBe('AL');

    const levels = result.current.fighterSkillLevels['fighter-id'];
    const xpLedger = result.current.xpLedger['fighter-id'];

    expect(levels).toBeDefined();
    // initialLevels["skill-1"] = 2, but xp sync effect recalculates level from XP (20 -> level 3 in mocked levelFromXp)
    expect(levels['skill-1']).toBe(3);
    expect(levels['skill-2']).toBe(0);

    // xpThresholdForLevel mocked as level * 10, and xp/level sync upgrades xp for skill-1 to level 3 -> 30
    expect(xpLedger).toBeDefined();
    expect(xpLedger['skill-1']).toBe(30);
    expect(xpLedger['skill-2']).toBe(0);
  });

  it('deletes fighter, clears related state, calls onRemoveFighterAssignments and pushes undo entry', () => {
    const args = createArgs();
    const undoPush = vi.fn();
    const onRemove = vi.fn();
    const { result } = renderHook(props => useFighterState(props), {
      initialProps: { ...args, undoManager: { push: undoPush } as any, onRemoveFighterAssignments: onRemove }
    });

    act(() => {
      result.current.addFighter('Bravo', { 'skill-1': 1, 'skill-2': 2 } as any, { callsign: 'BR' });
    });

    expect(result.current.fighters).toHaveLength(1);

    act(() => {
      result.current.deleteFighter('fighter-id');
    });

    expect(result.current.fighters).toHaveLength(0);
    expect(result.current.fighterSkillLevels['fighter-id']).toBeUndefined();
    expect(result.current.xpLedger['fighter-id']).toBeUndefined();
    expect(result.current.fighterSkills['fighter-id']).toBeUndefined();

    expect(onRemove).toHaveBeenCalledWith('fighter-id');
    expect(undoPush).toHaveBeenCalledTimes(1);

    const undoPayload = undoPush.mock.calls[0][0];
    expect(undoPayload).toMatchObject({
      type: 'delete_fighter',
      data: {
        fighter: expect.objectContaining({ id: 'fighter-id', name: 'Bravo', callsign: 'BR' })
      }
    });
  });
});
