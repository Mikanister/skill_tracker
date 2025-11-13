import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useSkillTreeState } from '@/hooks/skills/useSkillTreeState';
import { UndoManager } from '@/lib/undo';
import type { SkillTree, Skill, Category } from '@/types';
import {
  loadSkillTree,
  saveSkillTree,
  resetToSeed,
  getActiveProfile,
  setActiveProfile,
  listProfiles,
  ensureProfileExists
} from '@/storage';

vi.mock('@/storage', () => ({
  loadSkillTree: vi.fn(),
  saveSkillTree: vi.fn(),
  resetToSeed: vi.fn(),
  getActiveProfile: vi.fn(),
  setActiveProfile: vi.fn(),
  listProfiles: vi.fn(),
  ensureProfileExists: vi.fn()
}));

const loadSkillTreeMock = vi.mocked(loadSkillTree);
const saveSkillTreeMock = vi.mocked(saveSkillTree);
const resetToSeedMock = vi.mocked(resetToSeed);
const getActiveProfileMock = vi.mocked(getActiveProfile);
const setActiveProfileMock = vi.mocked(setActiveProfile);
const listProfilesMock = vi.mocked(listProfiles);
const ensureProfileExistsMock = vi.mocked(ensureProfileExists);

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const createSkill = (id: string, name = 'Skill'): Skill =>
  ({
    id,
    name,
    description: '',
    tags: [],
    isArchived: false,
    updatedAt: 0,
    levels: [1, 2, 3, 4, 5].map(level => ({
      level: level as 1 | 2 | 3 | 4 | 5,
      title: `Level ${level}`,
      tasks: []
    }))
  } as Skill);

const createCategory = (id: string, name: string, skills: Skill[] = []): Category =>
  ({ id, name, skills } as Category);

const defaultTree: SkillTree = {
  version: 1,
  categories: [createCategory('cat-1', 'Alpha', [createSkill('skill-1', 'Alpha Skill')])]
};

describe('useSkillTreeState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadSkillTreeMock.mockReturnValue(clone(defaultTree));
    resetToSeedMock.mockImplementation(() => clone(defaultTree));
    getActiveProfileMock.mockReturnValue('default');
    setActiveProfileMock.mockImplementation(() => {});
    ensureProfileExistsMock.mockImplementation(() => {});
    listProfilesMock.mockImplementation(() => ['default']);
    saveSkillTreeMock.mockImplementation(() => {});
  });

  it('deletes skill and records undo entry', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha', [createSkill('skill-1', 'First')])]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    act(() => {
      result.current.setSelectedSkillId('skill-1');
    });
    act(() => {
      result.current.deleteSkill('skill-1');
    });

    expect(result.current.tree.categories[0].skills).toHaveLength(0);
    expect(result.current.selectedSkillId).toBeNull();
    expect(undoManager.size).toBe(1);
    const action = undoManager.peek();
    expect(action).toMatchObject({
      type: 'delete_skill',
      data: {
        categoryId: 'cat-1',
        skill: expect.objectContaining({ id: 'skill-1' })
      }
    });
  });

  it('ignores deleteSkill when nothing matches', () => {
    const emptyTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha')]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(emptyTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    act(() => {
      result.current.deleteSkill('missing');
    });

    expect(undoManager.size).toBe(0);
    expect(result.current.tree.categories[0].skills).toHaveLength(0);
  });

  it('deletes category, updates selection and records undo entry', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [
        createCategory('cat-1', 'Alpha', [createSkill('skill-1')]),
        createCategory('cat-2', 'Bravo')
      ]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    act(() => {
      result.current.setSelectedCategoryId('cat-2');
    });
    act(() => {
      result.current.deleteCategory('cat-2');
    });

    expect(result.current.tree.categories.map(category => category.id)).toEqual(['cat-1']);
    expect(result.current.selectedCategoryId).toBe('cat-1');
    expect(result.current.selectedSkillId).toBeNull();
    expect(undoManager.size).toBe(1);
    expect(undoManager.peek()).toMatchObject({
      type: 'delete_category',
      data: { category: expect.objectContaining({ id: 'cat-2' }) }
    });
  });

  it('moves skill to another category', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [
        createCategory('cat-1', 'Alpha', [createSkill('skill-1')]),
        createCategory('cat-2', 'Bravo')
      ]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    act(() => {
      result.current.moveSkillToCategory('skill-1', 'cat-2');
    });

    const [cat1, cat2] = result.current.tree.categories;
    expect(cat1.skills).toHaveLength(0);
    expect(cat2.skills.map(skill => skill.id)).toEqual(['skill-1']);
  });

  it('restores skill without duplicating entries', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha')]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));
    const restored = createSkill('restored');

    act(() => {
      result.current.restoreSkill(restored, 'cat-1');
    });
    act(() => {
      result.current.restoreSkill(restored, 'cat-1');
    });

    const [category] = result.current.tree.categories;
    expect(category.skills).toHaveLength(1);
    expect(category.skills[0].id).toBe('restored');
  });

  it('restores category without duplicating entries', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha')]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));
    const restoredCategory = createCategory('cat-2', 'Bravo');

    act(() => {
      result.current.restoreCategory(restoredCategory);
    });
    act(() => {
      result.current.restoreCategory(restoredCategory);
    });

    expect(result.current.tree.categories.map(category => category.id)).toEqual(['cat-1', 'cat-2']);
  });

  it('resets to seed and clears selection', () => {
    const seededTree: SkillTree = {
      version: 1,
      categories: [createCategory('seed-cat', 'Seeded')]
    };
    resetToSeedMock.mockReturnValueOnce(clone(seededTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    act(() => {
      result.current.setSelectedCategoryId('cat-1');
      result.current.setSelectedSkillId('skill-any');
    });

    act(() => {
      result.current.onResetToSeed();
    });

    expect(result.current.tree.categories.map(category => category.id)).toEqual(['seed-cat']);
    expect(result.current.selectedCategoryId).toBe('seed-cat');
    expect(result.current.selectedSkillId).toBeNull();
  });

  it('switches profile and loads new tree', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha')]
    };
    const secondaryTree: SkillTree = {
      version: 1,
      categories: [createCategory('alt-cat', 'Secondary')]
    };

    loadSkillTreeMock
      .mockReturnValueOnce(clone(initialTree))
      .mockReturnValueOnce(clone(secondaryTree));
    listProfilesMock.mockImplementation(() => ['default', 'secondary']);

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    act(() => {
      result.current.switchProfile('secondary');
    });

    expect(ensureProfileExistsMock).toHaveBeenCalledWith('secondary');
    expect(setActiveProfileMock).toHaveBeenCalledWith('secondary');
    expect(result.current.profile).toBe('secondary');
    expect(result.current.tree.categories.map(category => category.id)).toEqual(['alt-cat']);
    expect(result.current.selectedCategoryId).toBe('alt-cat');
    expect(result.current.profiles).toEqual(['default', 'secondary']);
  });

  it('adds skill to category and persists tree', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha')]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    act(() => {
      result.current.addSkill('cat-1', 'Navigation');
    });

    const [category] = result.current.tree.categories;
    expect(category.skills).toHaveLength(1);
    expect(category.skills[0]).toMatchObject({ name: 'Navigation', isArchived: false });
    expect(saveSkillTreeMock).toHaveBeenCalled();
  });

  it('updates skill details inside category', () => {
    const existing = createSkill('skill-1', 'Medical');
    const initialTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha', [existing])]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    const updated: Skill = { ...existing, name: 'Updated', description: 'Desc' };

    act(() => {
      result.current.updateSkill(updated);
    });

    const [category] = result.current.tree.categories;
    expect(category.skills[0].name).toBe('Updated');
    expect(category.skills[0].description).toBe('Desc');
    expect(category.skills[0].updatedAt).toEqual(expect.any(Number));
  });

  it('renames category when it exists', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha')]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    act(() => {
      result.current.renameCategory('cat-1', 'Bravo Squad');
    });

    expect(result.current.tree.categories[0].name).toBe('Bravo Squad');
  });

  it('lists profiles with fallback to default when storage throws', () => {
    loadSkillTreeMock.mockReturnValueOnce(clone(defaultTree));
    listProfilesMock.mockImplementationOnce(() => { throw new Error('bad json'); });

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    expect(result.current.profiles).toEqual(['default']);
  });

  it('initializes with null selections when tree has no categories', () => {
    const emptyTree: SkillTree = { version: 1, categories: [] };
    loadSkillTreeMock.mockReturnValueOnce(clone(emptyTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    expect(result.current.selectedCategoryId).toBeNull();
    expect(result.current.selectedCategory).toBeUndefined();
    expect(result.current.selectedSkill).toBeUndefined();

    act(() => {
      result.current.setSelectedSkillId('any-skill');
    });

    expect(result.current.selectedSkill).toBeUndefined();
  });

  it('keeps selectedSkill undefined until an id is provided and then resolves to skill', () => {
    loadSkillTreeMock.mockReturnValueOnce(clone(defaultTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    expect(result.current.selectedSkill).toBeUndefined();

    act(() => {
      result.current.setSelectedSkillId('skill-1');
    });

    expect(result.current.selectedSkill).toMatchObject({ id: 'skill-1', name: 'Alpha Skill' });
  });

  it('ignores addSkill when category does not exist', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha')]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    saveSkillTreeMock.mockClear();

    act(() => {
      result.current.addSkill('missing', 'Ghost Skill');
    });

    expect(result.current.tree.categories).toHaveLength(1);
    expect(result.current.tree.categories[0].skills).toHaveLength(0);
    expect(saveSkillTreeMock).not.toHaveBeenCalled();
  });

  it('ignores moveSkillToCategory when skill is absent', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha', [createSkill('skill-1')]), createCategory('cat-2', 'Bravo')]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    act(() => {
      result.current.moveSkillToCategory('missing', 'cat-2');
    });

    const [cat1, cat2] = result.current.tree.categories;
    expect(cat1.skills.map(skill => skill.id)).toEqual(['skill-1']);
    expect(cat2.skills).toHaveLength(0);
  });

  it('removes skill when moving to absent target category', () => {
    const initialTree: SkillTree = {
      version: 1,
      categories: [createCategory('cat-1', 'Alpha', [createSkill('skill-1')])]
    };
    loadSkillTreeMock.mockReturnValueOnce(clone(initialTree));

    const undoManager = new UndoManager();
    const { result } = renderHook(() => useSkillTreeState({ undoManager }));

    act(() => {
      result.current.moveSkillToCategory('skill-1', 'missing');
    });

    expect(result.current.tree.categories[0].skills).toHaveLength(0);
  });
});
