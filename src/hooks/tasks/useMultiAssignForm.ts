import { useCallback, useMemo, useState } from 'react';
import {
  Category,
  Fighter,
  FighterSkillLevels,
  TaskV2,
  TaskV2Assignee,
  TaskV2AssigneeSkill
} from '@/types';
import { computeSuggestedXp, repetitionFactorFromTasks } from '@/utils';

type Difficulty = 1 | 2 | 3 | 4 | 5;

type MultiAssignFormState = {
  title: string;
  description: string;
  difficulty: Difficulty;
  isPriority: boolean;
  search: string;
  selectedFighters: Record<string, boolean>;
  assigneeSkills: Record<string, Record<string, number>>;
  error: string | null;
};

/**
 * Options for {@link useMultiAssignForm}, linking available fighters/categories and existing tasks.
 */
type UseMultiAssignFormOptions = {
  fighters: Fighter[];
  categories: Category[];
  tasks: TaskV2[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  defaultDifficulty?: Difficulty;
};

/**
 * Payload produced when submit succeeds.
 */
type SubmissionPayload = {
  title: string;
  description?: string;
  difficulty: Difficulty;
  assignees: TaskV2Assignee[];
  isPriority?: boolean;
};

/**
 * Public API returned from {@link useMultiAssignForm} exposing form state and helpers.
 */
type UseMultiAssignFormReturn = {
  title: string;
  description: string;
  difficulty: Difficulty;
  isPriority: boolean;
  search: string;
  error: string | null;
  selectedFighters: Record<string, boolean>;
  assigneeSkills: Record<string, Record<string, number>>;
  filteredFighters: Fighter[];
  selectedFighterList: Fighter[];
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setDifficulty: (value: Difficulty) => void;
  setIsPriority: (value: boolean) => void;
  setSearch: (value: string) => void;
  toggleFighter: (fighterId: string, checked: boolean) => void;
  toggleSkill: (fighterId: string, skillId: string, checked: boolean) => void;
  setSkillXp: (fighterId: string, skillId: string, value: number) => void;
  submit: () => SubmissionPayload | null;
  reset: () => void;
  clearError: () => void;
};

const buildInitialState = (defaultDifficulty: Difficulty): MultiAssignFormState => ({
  title: '',
  description: '',
  difficulty: defaultDifficulty,
  isPriority: false,
  search: '',
  selectedFighters: {},
  assigneeSkills: {},
  error: null
});

/**
 * Manages multi-assignee task composition state, including suggested XP calculations and validation.
 */
export function useMultiAssignForm({
  fighters,
  categories,
  tasks,
  fighterSkillLevels,
  defaultDifficulty = 3
}: UseMultiAssignFormOptions): UseMultiAssignFormReturn {
  const [state, setState] = useState<MultiAssignFormState>(() => buildInitialState(defaultDifficulty));

  const skillIndex = useMemo(() => {
    const map = new Map<string, { categoryId: string }>();
    for (const category of categories) {
      for (const skill of category.skills) {
        map.set(skill.id, { categoryId: category.id });
      }
    }
    return map;
  }, [categories]);

  const filteredFighters = useMemo(() => {
    const term = state.search.trim().toLowerCase();
    if (!term) return fighters;
    return fighters.filter(f => {
      const name = f.fullName || f.callsign || f.name || '';
      return name.toLowerCase().includes(term);
    });
  }, [fighters, state.search]);

  const selectedFighterList = useMemo(
    () => fighters.filter(f => !!state.selectedFighters[f.id]),
    [fighters, state.selectedFighters]
  );

  const computeLineXp = useCallback(
    (fighterId: string, skillId: string, overrides?: { difficulty?: Difficulty; title?: string }) => {
      const diff = overrides?.difficulty ?? state.difficulty;
      const taskTitle = overrides?.title ?? state.title;
      const level = fighterSkillLevels[fighterId]?.[skillId] ?? 0;
      const rep = repetitionFactorFromTasks(tasks, {
        fighterId,
        skillId,
        difficulty: diff,
        title: taskTitle
      });
      const repetitionCount = Math.max(1, rep.count);
      const base = computeSuggestedXp({
        difficulty: diff,
        isNovice: level <= 1,
        repetitionCount
      });
      return Math.round(base * rep.factor);
    },
    [fighterSkillLevels, tasks, state.difficulty, state.title]
  );

  const recomputeAssigneeSkills = useCallback(
    (
      current: MultiAssignFormState['assigneeSkills'],
      difficultyValue: Difficulty,
      titleValue: string
    ) => {
      if (!Object.keys(current).length) return current;
      const next: MultiAssignFormState['assigneeSkills'] = {};
      let changed = false;
      for (const [fighterId, skills] of Object.entries(current)) {
        const updated: Record<string, number> = {};
        for (const skillId of Object.keys(skills)) {
          const xp = computeLineXp(fighterId, skillId, {
            difficulty: difficultyValue,
            title: titleValue
          });
          updated[skillId] = xp;
          if (!changed && xp !== skills[skillId]) changed = true;
        }
        next[fighterId] = updated;
      }
      return changed ? next : current;
    },
    [computeLineXp]
  );

  const setTitle = useCallback(
    (value: string) => {
      setState(prev => {
        if (prev.title === value) return prev;
        const assigneeSkills = recomputeAssigneeSkills(prev.assigneeSkills, prev.difficulty, value);
        return {
          ...prev,
          title: value,
          assigneeSkills,
          error: null
        };
      });
    },
    [recomputeAssigneeSkills]
  );

  const setDescription = useCallback((value: string) => {
    setState(prev => ({ ...prev, description: value }));
  }, []);

  const setDifficulty = useCallback(
    (value: Difficulty) => {
      setState(prev => {
        if (prev.difficulty === value) return prev;
        const assigneeSkills = recomputeAssigneeSkills(prev.assigneeSkills, value, prev.title);
        return {
          ...prev,
          difficulty: value,
          assigneeSkills,
          error: null
        };
      });
    },
    [recomputeAssigneeSkills]
  );

  const setIsPriority = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, isPriority: value, error: null }));
  }, []);

  const setSearch = useCallback((value: string) => {
    setState(prev => ({ ...prev, search: value }));
  }, []);

  const toggleFighter = useCallback((fighterId: string, checked: boolean) => {
    setState(prev => {
      const selected = { ...prev.selectedFighters };
      let assigneeSkills = prev.assigneeSkills;

      if (checked) {
        selected[fighterId] = true;
      } else {
        delete selected[fighterId];
        if (assigneeSkills[fighterId]) {
          const { [fighterId]: _removed, ...rest } = assigneeSkills;
          assigneeSkills = rest;
        }
      }

      return {
        ...prev,
        selectedFighters: selected,
        assigneeSkills,
        error: null
      };
    });
  }, []);

  const toggleSkill = useCallback(
    (fighterId: string, skillId: string, checked: boolean) => {
      setState(prev => {
        const nextSkills = { ...prev.assigneeSkills };
        const fighterSkills = { ...(nextSkills[fighterId] ?? {}) };

        if (checked) {
          fighterSkills[skillId] = computeLineXp(fighterId, skillId);
          nextSkills[fighterId] = fighterSkills;
        } else {
          delete fighterSkills[skillId];
          if (Object.keys(fighterSkills).length === 0) {
            delete nextSkills[fighterId];
          } else {
            nextSkills[fighterId] = fighterSkills;
          }
        }

        return {
          ...prev,
          assigneeSkills: nextSkills,
          error: null
        };
      });
    },
    [computeLineXp]
  );

  const setSkillXp = useCallback((fighterId: string, skillId: string, value: number) => {
    setState(prev => {
      const nextSkills = { ...prev.assigneeSkills };
      const fighterSkills = { ...(nextSkills[fighterId] ?? {}) };
      fighterSkills[skillId] = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
      nextSkills[fighterId] = fighterSkills;
      return {
        ...prev,
        assigneeSkills: nextSkills,
        error: null
      };
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => (prev.error ? { ...prev, error: null } : prev));
  }, []);

  const buildAssignees = useCallback((): TaskV2Assignee[] => {
    const assignees: TaskV2Assignee[] = [];
    for (const [fighterId, isSelected] of Object.entries(state.selectedFighters)) {
      if (!isSelected) continue;
      const skillsMap = state.assigneeSkills[fighterId] ?? {};
      const skillEntries: TaskV2AssigneeSkill[] = Object.entries(skillsMap)
        .map(([skillId, xp]) => ({
          skillId,
          categoryId: skillIndex.get(skillId)?.categoryId ?? '',
          xpSuggested: Math.max(0, Math.round(Number(xp) || 0))
        }))
        .filter(skill => skill.xpSuggested > 0);
      if (skillEntries.length > 0) {
        assignees.push({ fighterId, skills: skillEntries });
      }
    }
    return assignees;
  }, [skillIndex, state.assigneeSkills, state.selectedFighters]);

  const submit = useCallback((): SubmissionPayload | null => {
    const trimmedTitle = state.title.trim();
    if (!trimmedTitle) {
      setState(prev => ({ ...prev, error: 'Вкажіть назву задачі.' }));
      return null;
    }

    const assignees = buildAssignees();
    if (assignees.length === 0) {
      setState(prev => ({ ...prev, error: 'Оберіть виконавців та додайте їм навички.' }));
      return null;
    }

    setState(prev => ({ ...prev, error: null }));

    return {
      title: trimmedTitle,
      description: state.description.trim() || undefined,
      difficulty: state.difficulty,
      assignees,
      isPriority: state.isPriority || undefined
    };
  }, [buildAssignees, state.description, state.difficulty, state.isPriority, state.title]);

  const reset = useCallback(() => {
    setState(buildInitialState(defaultDifficulty));
  }, [defaultDifficulty]);

  return {
    title: state.title,
    description: state.description,
    difficulty: state.difficulty,
    isPriority: state.isPriority,
    search: state.search,
    error: state.error,
    selectedFighters: state.selectedFighters,
    assigneeSkills: state.assigneeSkills,
    filteredFighters,
    selectedFighterList,
    setTitle,
    setDescription,
    setDifficulty,
    setIsPriority,
    setSearch,
    toggleFighter,
    toggleSkill,
    setSkillXp,
    submit,
    reset,
    clearError
  };
}
