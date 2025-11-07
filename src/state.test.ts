import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSkillRpgState } from './state';
import type { TaskV2Assignee } from './types';

beforeEach(() => {
  localStorage.clear();
});

describe('useSkillRpgState basics', () => {
  it('creates fighter with levels and baseline xp', () => {
    const { result } = renderHook(() => useSkillRpgState());
    act(() => {
      result.current.addFighter('Alpha', { foo: 2 as any });
    });
    const fid = result.current.fighters[0].id;
    expect(result.current.fighterSkillLevels[fid]).toBeTruthy();
    // baseline xp set to threshold (level 2 -> 60)
    expect(result.current.xpLedger[fid]).toBeTruthy();
  });

  it('approves TaskV2 and writes xp to ledger then levels recompute', () => {
    const { result } = renderHook(() => useSkillRpgState());
    act(() => {
      result.current.addFighter('Bravo', {});
    });
    const fid = result.current.fighters[0].id;
    // Ensure one skill exists
    const catId = result.current.tree.categories[0].id;
    const skillId = result.current.tree.categories[0].skills[0].id;
    const assignees: TaskV2Assignee[] = [{ fighterId: fid, skills: [{ skillId, categoryId: catId, xpSuggested: 200 }] }];
    act(() => {
      result.current.createTaskV2({ title: 'Test task', description: '', difficulty: 3, assignees });
    });
    const tid = result.current.tasksV2[0].id;
    act(() => {
      result.current.updateTaskV2Status(tid, 'validation');
      result.current.approveTaskV2(tid, { [fid]: { [skillId]: 200 } });
    });
    // XP should be added
    expect(result.current.xpLedger[fid][skillId]).toBeGreaterThanOrEqual(200);
    // Level should recompute (200 XP corresponds to level 2 under new thresholds)
    expect(result.current.fighterSkillLevels[fid][skillId]).toBeGreaterThanOrEqual(2);
  });

  it('can undo deletions of fighter, task, skill, and category', () => {
    const { result } = renderHook(() => useSkillRpgState());

    // Add fighter and delete to populate undo stack
    act(() => {
      result.current.addFighter('Charlie', {});
    });
    const fighterId = result.current.fighters.find(f => f.name === 'Charlie')!.id;
    act(() => {
      result.current.deleteFighter(fighterId);
    });

    // Create task and delete
    act(() => {
      result.current.createTaskV2({ title: 'Temp task', description: '', difficulty: 2, assignees: [] });
    });
    const taskId = result.current.tasksV2[0].id;
    act(() => {
      result.current.deleteTaskV2(taskId);
    });

    // Add skill and delete
    const categoryId = result.current.tree.categories[0].id;
    act(() => {
      result.current.addSkill(categoryId, 'Skill X');
    });
    const skillId = result.current.tree.categories
      .find(c => c.id === categoryId)!
      .skills.find(s => s.name === 'Skill X')!.id;
    act(() => {
      result.current.deleteSkill(skillId);
    });

    // Add category and delete
    act(() => {
      result.current.addCategory('Temp category');
    });
    const tempCategoryId = result.current.tree.categories.find(c => c.name === 'Temp category')!.id;
    act(() => {
      result.current.deleteCategory(tempCategoryId);
    });

    expect(result.current.canUndo).toBe(true);

    act(() => {
      const description = result.current.performUndo();
      expect(description).toContain('Видалено категорію');
    });

    act(() => {
      const description = result.current.performUndo();
      expect(description).toContain('Видалено навичку');
    });

    act(() => {
      const description = result.current.performUndo();
      expect(description).toContain('Видалено задачу');
    });

    act(() => {
      const description = result.current.performUndo();
      expect(description).toContain('Видалено бійця');
    });

    expect(result.current.canUndo).toBe(false);
  });

  it('handles profile switching and reset to seed', () => {
    const { result } = renderHook(() => useSkillRpgState());

    act(() => {
      result.current.switchProfile('custom');
    });

    expect(result.current.profile).toBe('custom');
    expect(result.current.profiles).toContain('custom');

    // Modify some data to ensure reset works
    act(() => {
      result.current.addCategory('New Cat');
    });
    expect(result.current.tree.categories.some(c => c.name === 'New Cat')).toBe(true);

    act(() => {
      result.current.onResetToSeed();
    });

    expect(result.current.tree.categories.some(c => c.name === 'New Cat')).toBe(false);
  });
});
