import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useMultiAssignForm } from '@/hooks/tasks/useMultiAssignForm';
import type { Category, Fighter, FighterSkillLevels, TaskV2 } from '@/types';

describe('useMultiAssignForm', () => {
  const fighters: Fighter[] = [{ id: 'fighter-1', name: 'Alpha' } as Fighter];
  const categories: Category[] = [
    {
      id: 'cat-1',
      name: 'Support',
      skills: [
        {
          id: 'skill-1',
          name: 'Medical',
          description: '',
          levels: [
            { level: 1, title: 'Level 1', tasks: [] },
            { level: 2, title: 'Level 2', tasks: [] },
            { level: 3, title: 'Level 3', tasks: [] },
            { level: 4, title: 'Level 4', tasks: [] },
            { level: 5, title: 'Level 5', tasks: [] }
          ]
        }
      ]
    }
  ];
  const fighterSkillLevels: Record<string, FighterSkillLevels> = { 'fighter-1': { 'skill-1': 1 } };
  const tasks: TaskV2[] = [];

  it('removes fighter skills when toggled off', () => {
    const { result } = renderHook(() =>
      useMultiAssignForm({ fighters, categories, tasks, fighterSkillLevels, defaultDifficulty: 3 })
    );

    act(() => {
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
    });

    expect(result.current.assigneeSkills['fighter-1']).toBeDefined();

    act(() => {
      result.current.toggleFighter('fighter-1', false);
    });

    expect(result.current.selectedFighters['fighter-1']).toBeUndefined();
    expect(result.current.assigneeSkills['fighter-1']).toBeUndefined();
  });

  it('validates submit and produces payload with selected assignees', () => {
    const { result } = renderHook(() =>
      useMultiAssignForm({ fighters, categories, tasks, fighterSkillLevels, defaultDifficulty: 3 })
    );

    act(() => {
      result.current.setTitle('   ');
    });

    let emptyPayload: ReturnType<typeof result.current.submit> = null;
    act(() => {
      emptyPayload = result.current.submit();
    });
    expect(emptyPayload).toBeNull();
    expect(result.current.error).toBe('Вкажіть назву задачі.');

    act(() => {
      result.current.setTitle('Mission');
      result.current.setDescription('  summary  ');
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
    });

    let payload: ReturnType<typeof result.current.submit> = null;
    act(() => {
      payload = result.current.submit();
    });
    expect(payload).not.toBeNull();
    expect(payload).toMatchObject({
      title: 'Mission',
      description: 'summary',
      assignees: [
        {
          fighterId: 'fighter-1',
          skills: [expect.objectContaining({ skillId: 'skill-1', xpSuggested: expect.any(Number) })]
        }
      ]
    });
    expect(result.current.error).toBeNull();
  });

  it('clamps skill xp to non-negative integers', () => {
    const { result } = renderHook(() =>
      useMultiAssignForm({ fighters, categories, tasks, fighterSkillLevels, defaultDifficulty: 3 })
    );

    act(() => {
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
    });

    act(() => {
      result.current.setSkillXp('fighter-1', 'skill-1', -10);
    });
    expect(result.current.assigneeSkills['fighter-1']['skill-1']).toBe(0);

    act(() => {
      result.current.setSkillXp('fighter-1', 'skill-1', Number.NaN);
    });
    expect(result.current.assigneeSkills['fighter-1']['skill-1']).toBe(0);

    act(() => {
      result.current.setSkillXp('fighter-1', 'skill-1', 7.6);
    });
    expect(result.current.assigneeSkills['fighter-1']['skill-1']).toBe(8);
  });

  it('filters fighters by search term without mutating original list', () => {
    const moreFighters: Fighter[] = [
      { id: 'fighter-1', name: 'Alpha', callsign: 'AL' } as Fighter,
      { id: 'fighter-2', name: 'Bravo', fullName: 'Bravo Team' } as Fighter,
      { id: 'fighter-3', name: 'Charlie' } as Fighter
    ];
    const extendedSkillLevels: Record<string, FighterSkillLevels> = {
      'fighter-1': { 'skill-1': 1 },
      'fighter-2': { 'skill-1': 2 },
      'fighter-3': { 'skill-1': 3 }
    };

    const { result } = renderHook(() =>
      useMultiAssignForm({
        fighters: moreFighters,
        categories,
        tasks,
        fighterSkillLevels: extendedSkillLevels,
        defaultDifficulty: 3
      })
    );

    expect(result.current.filteredFighters).toHaveLength(3);

    act(() => {
      result.current.setSearch('  bravo  ');
    });

    expect(result.current.search).toBe('  bravo  ');
    expect(result.current.filteredFighters).toHaveLength(1);
    expect(result.current.filteredFighters[0].id).toBe('fighter-2');

    act(() => {
      result.current.setSearch('');
    });

    expect(result.current.filteredFighters).toHaveLength(3);
  });

  it('recomputes assignee skills when title or difficulty change and skips redundant updates', () => {
    const { result } = renderHook(() =>
      useMultiAssignForm({ fighters, categories, tasks, fighterSkillLevels, defaultDifficulty: 3 })
    );

    act(() => {
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
    });

    const initialXp = result.current.assigneeSkills['fighter-1']['skill-1'];

    act(() => {
      result.current.setTitle('Mission Alpha');
    });
    const afterTitleFirst = result.current.assigneeSkills;

    act(() => {
      result.current.setTitle('Mission Alpha');
    });
    expect(result.current.assigneeSkills).toBe(afterTitleFirst);

    act(() => {
      result.current.setDifficulty(5);
    });
    const afterDifficulty = result.current.assigneeSkills;
    const updatedXp = afterDifficulty['fighter-1']['skill-1'];
    expect(updatedXp).not.toBe(initialXp);

    act(() => {
      result.current.setDifficulty(5);
    });
    expect(result.current.assigneeSkills).toBe(afterDifficulty);
  });

  it('updates miscellaneous setters and removes skills when toggled off', () => {
    const { result } = renderHook(() =>
      useMultiAssignForm({ fighters, categories, tasks, fighterSkillLevels, defaultDifficulty: 3 })
    );

    act(() => {
      result.current.setDescription('Додаткові деталі');
      result.current.setIsPriority(true);
    });
    expect(result.current.description).toBe('Додаткові деталі');
    expect(result.current.isPriority).toBe(true);

    act(() => {
      result.current.setSearch('alpha');
    });
    expect(result.current.filteredFighters).toHaveLength(1);

    act(() => {
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
    });
    expect(result.current.assigneeSkills['fighter-1']).toBeDefined();

    act(() => {
      result.current.toggleSkill('fighter-1', 'skill-1', false);
    });
    expect(result.current.assigneeSkills['fighter-1']).toBeUndefined();

    act(() => {
      result.current.setTitle('   ');
    });
    act(() => {
      result.current.submit();
    });
    expect(result.current.error).toBe('Вкажіть назву задачі.');

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });

  it('filters out assignees without positive xp and returns error when none left', () => {
    const { result } = renderHook(() =>
      useMultiAssignForm({ fighters, categories, tasks, fighterSkillLevels, defaultDifficulty: 3 })
    );

    act(() => {
      result.current.setTitle('Mission');
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
      result.current.setSkillXp('fighter-1', 'skill-1', 0);
    });

    let payload: ReturnType<typeof result.current.submit> = undefined as any;
    act(() => {
      payload = result.current.submit();
    });

    expect(payload).toBeNull();
    expect(result.current.error).toBe('Оберіть виконавців та додайте їм навички.');
  });

  it('resets to defaults and clears selections', () => {
    const { result } = renderHook(() =>
      useMultiAssignForm({ fighters, categories, tasks, fighterSkillLevels, defaultDifficulty: 4 })
    );

    act(() => {
      result.current.setTitle('Mission');
      result.current.setDescription('Desc');
      result.current.setDifficulty(2 as 1 | 2 | 3 | 4 | 5);
      result.current.setIsPriority(true);
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.title).toBe('');
    expect(result.current.description).toBe('');
    expect(result.current.difficulty).toBe(4);
    expect(result.current.isPriority).toBe(false);
    expect(result.current.selectedFighters).toEqual({});
    expect(result.current.assigneeSkills).toEqual({});
    expect(result.current.error).toBeNull();
  });

  const buildPayloadWithPriority = () => {
    const customTasks: TaskV2[] = [
      {
        id: 'existing',
        title: 'Mission',
        status: 'todo',
        difficulty: 3,
        assignees: [
          {
            fighterId: 'fighter-1',
            skills: [
              {
                skillId: 'skill-1',
                categoryId: 'cat-1',
                xpSuggested: 5,
                xpApproved: undefined
              }
            ]
          }
        ]
      } as TaskV2
    ];

    const extendedCategories: Category[] = [
      {
        id: 'cat-1',
        name: 'Support',
        skills: [
          {
            id: 'skill-1',
            name: 'Medical',
            description: '',
            levels: []
          }
        ]
      } as Category
    ];

    const { result } = renderHook(() =>
      useMultiAssignForm({
        fighters,
        categories: extendedCategories,
        tasks: customTasks,
        fighterSkillLevels: fighterSkillLevels,
        defaultDifficulty: 3
      })
    );

    act(() => {
      result.current.setTitle('Mission');
      result.current.setDescription('Brief');
      result.current.setIsPriority(true);
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
    });

    let payload: ReturnType<typeof result.current.submit> = null;
    act(() => {
      payload = result.current.submit();
    });

    if (!payload) {
      throw new Error('Expected submit to return payload');
    }

    return payload as NonNullable<ReturnType<typeof result.current.submit>>;
  };

  it('computes xp with repetition factor and builds full payload', () => {
    const payload = buildPayloadWithPriority();

    expect(payload).not.toBeNull();
    expect(payload).toMatchObject({
      title: 'Mission',
      description: 'Brief',
      difficulty: 3,
      isPriority: true
    });

    const assignee = payload.assignees[0];
    expect(assignee.fighterId).toBe('fighter-1');
    expect(assignee.skills[0]).toMatchObject({
      skillId: 'skill-1',
      categoryId: 'cat-1',
      xpSuggested: expect.any(Number)
    });
  });

  it('keeps assignee skills reference when recomputation yields identical values', () => {
    const { result } = renderHook(() =>
      useMultiAssignForm({ fighters, categories, tasks, fighterSkillLevels, defaultDifficulty: 3 })
    );

    act(() => {
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
    });

    const currentSkills = result.current.assigneeSkills;

    act(() => {
      result.current.setTitle('Training Run');
    });

    expect(result.current.assigneeSkills).toBe(currentSkills);
  });

  it('removes deselected skill but retains fighter entry when others remain', () => {
    const dualSkillCategory: Category[] = [
      {
        id: 'cat-1',
        name: 'Support',
        skills: [
          {
            id: 'skill-1',
            name: 'Medical',
            description: '',
            levels: []
          },
          {
            id: 'skill-2',
            name: 'Navigation',
            description: '',
            levels: []
          }
        ]
      } as Category
    ];

    const { result } = renderHook(() =>
      useMultiAssignForm({ fighters, categories: dualSkillCategory, tasks, fighterSkillLevels, defaultDifficulty: 3 })
    );

    act(() => {
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
      result.current.toggleSkill('fighter-1', 'skill-2', true);
    });

    act(() => {
      result.current.toggleSkill('fighter-1', 'skill-1', false);
    });

    expect(result.current.assigneeSkills['fighter-1']).toBeDefined();
    expect(Object.keys(result.current.assigneeSkills['fighter-1'])).toEqual(['skill-2']);
  });

  it('omits priority flag in payload when not set', () => {
    const payloadWithPriority = buildPayloadWithPriority();

    const { result } = renderHook(() =>
      useMultiAssignForm({ fighters, categories, tasks, fighterSkillLevels, defaultDifficulty: 3 })
    );

    act(() => {
      result.current.setTitle('Mission');
      result.current.toggleFighter('fighter-1', true);
      result.current.toggleSkill('fighter-1', 'skill-1', true);
    });

    let payload: ReturnType<typeof result.current.submit> | null = null;
    act(() => {
      payload = result.current.submit();
    });

    expect(payload).not.toBeNull();
    expect(payload).not.toMatchObject({ isPriority: payloadWithPriority.isPriority });
    expect(payload).not.toHaveProperty('isPriority', true);
  });
});
