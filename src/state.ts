import { useEffect, useMemo, useState } from 'react';
import { Category, Mode, Skill, SkillTree, Fighter, UserTask, FighterXpLedger, FighterSkills, FighterSkillLevels, TaskV2, TaskV2Status, TaskComment } from './types';
import { levelFromXp, xpThresholdForLevel } from './utils';
import { loadSkillTree, saveSkillTree, resetToSeed, getActiveProfile, setActiveProfile, listProfiles, ensureProfileExists } from './storage';
import { safeGetItem, safeSetItem, generateId, validators } from './lib/storage';
import { UndoManager, UndoAction } from './lib/undo';

export function useSkillRpgState() {
  const [profile, setProfile] = useState<string>(() => getActiveProfile());
  const [tree, setTree] = useState<SkillTree>(() => loadSkillTree());
  const [fighters, setFighters] = useState<Fighter[]>(() => 
    safeGetItem('skillrpg_fighters', [], validators.isFightersArray)
  );
  const [selectedFighterId, setSelectedFighterId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<UserTask[]>(() => 
    safeGetItem('skillrpg_tasks', [])
  );
  const [tasksV2, setTasksV2] = useState<TaskV2[]>(() => 
    safeGetItem('skillrpg_tasks_v2', [], validators.isTasksV2Array)
  );
  const [xpLedger, setXpLedger] = useState<Record<string, FighterXpLedger>>(() => 
    safeGetItem('skillrpg_xp', {})
  );
  const [fighterSkillLevels, setFighterSkillLevels] = useState<Record<string, FighterSkillLevels>>(() => 
    safeGetItem('skillrpg_fighter_skill_levels', {})
  );
  const [fighterSkills, setFighterSkills] = useState<Record<string, FighterSkills>>(() => 
    safeGetItem('skillrpg_fighter_skills', {})
  );
  
  // Undo manager for deletions
  const [undoManager] = useState(() => new UndoManager());
  const [mode, setMode] = useState<Mode>('view');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    tree.categories[0]?.id ?? null
  );
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  useEffect(() => {
    saveSkillTree(tree, profile);
  }, [tree, profile]);

  useEffect(() => {
    safeSetItem('skillrpg_fighters', fighters);
  }, [fighters]);

  // Keep fighterSkillLevels in sync with current tree skills
  useEffect(() => {
    if (!tree.categories.length) return;
    const allSkillIds = new Set<string>();
    for (const c of tree.categories) for (const s of c.skills) allSkillIds.add(s.id);
    setFighterSkillLevels(prev => {
      let changed = false;
      const next: Record<string, FighterSkillLevels> = {};
      for (const [fid, levels] of Object.entries(prev)) {
        const updated: FighterSkillLevels = {};
        for (const id of allSkillIds) {
          updated[id] = (levels[id] ?? 0) as 0|1|2|3|4|5|6|7|8|9|10;
        }

        if (Object.keys(updated).length !== Object.keys(levels || {}).length) changed = true;
        else {
          for (const id of Object.keys(updated)) if (updated[id] !== levels[id]) { changed = true; break; }
        }
        next[fid] = updated;
      }
      return changed ? next : prev;
    });
  }, [tree]);
  useEffect(() => {
    safeSetItem('skillrpg_tasks', tasks);
  }, [tasks]);
  useEffect(() => {
    safeSetItem('skillrpg_tasks_v2', tasksV2);
  }, [tasksV2]);
  useEffect(() => {
    safeSetItem('skillrpg_xp', xpLedger);
  }, [xpLedger]);
  useEffect(() => {
    safeSetItem('skillrpg_fighter_skill_levels', fighterSkillLevels);
  }, [fighterSkillLevels]);
  useEffect(() => {
    safeSetItem('skillrpg_fighter_skills', fighterSkills);
  }, [fighterSkills]);

  // Recompute levels from XP whenever XP changes
  useEffect(() => {
    setFighterSkillLevels(prev => {
      let changed = false;
      const next: Record<string, FighterSkillLevels> = { ...prev };
      for (const [fid, ledger] of Object.entries(xpLedger)) {
        const currentLevels = prev[fid] ?? {} as FighterSkillLevels;
        const updated: FighterSkillLevels = { ...currentLevels };
        for (const [skillId, xp] of Object.entries(ledger)) {
          const lvl = levelFromXp(Number(xp) || 0);
          if (updated[skillId] !== lvl) { updated[skillId] = lvl; changed = true; }
        }
        next[fid] = updated;
      }
      return changed ? next : prev;
    });
  }, [xpLedger]);

  // Ensure XP ledger is at least threshold for any skill with level > 0 (migration/backfill)
  useEffect(() => {
    setXpLedger(prev => {
      let changed = false;
      const next: Record<string, FighterXpLedger> = { ...prev };
      for (const [fid, levels] of Object.entries(fighterSkillLevels)) {
        const ledger = { ...(next[fid] ?? {}) } as FighterXpLedger;
        let localChanged = false;
        for (const [skillId, lvl] of Object.entries(levels)) {
          const levelNum = Number(lvl) as 0|1|2|3|4|5|6|7|8|9|10;
          if (levelNum > 0) {
            const minXp = xpThresholdForLevel(levelNum);
            const curr = Number(ledger[skillId] ?? 0);
            if (isNaN(curr) || curr < minXp) {
              ledger[skillId] = minXp;
              localChanged = true;
            }
          }
        }
        if (localChanged && JSON.stringify(ledger) !== JSON.stringify(next[fid])) {
          next[fid] = ledger;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [fighterSkillLevels]);

  // Ensure each fighter has initialized skill map and XP ledger
  useEffect(() => {
    if (!fighters.length) return;
    setFighterSkillLevels(prev => {
      let changed = false;
      const next = { ...prev } as Record<string, FighterSkillLevels>;
      for (const f of fighters) {
        if (!next[f.id]) { next[f.id] = {}; changed = true; }
      }
      return changed ? next : prev;
    });
    setXpLedger(prev => {
      let changed = false;
      const next = { ...prev } as Record<string, FighterXpLedger>;
      for (const f of fighters) {
        if (!next[f.id]) { next[f.id] = {}; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [fighters]);

  const selectedCategory: Category | undefined = useMemo(
    () => tree.categories.find(c => c.id === selectedCategoryId),
    [tree, selectedCategoryId]
  );

  const selectedSkill: Skill | undefined = useMemo(() => {
    if (!selectedCategory) return undefined;
    return selectedCategory.skills.find(s => s.id === selectedSkillId);
  }, [selectedCategory, selectedSkillId]);

  function onResetToSeed() {
    const fresh = resetToSeed(profile);
    setTree(fresh);
    setSelectedCategoryId(fresh.categories[0]?.id ?? null);
    setSelectedSkillId(null);
  }

  function switchProfile(nextProfile: string) {
    ensureProfileExists(nextProfile);
    setActiveProfile(nextProfile);
    setProfile(nextProfile);
    const loaded = loadSkillTree(nextProfile);
    setTree(loaded);
    setSelectedCategoryId(loaded.categories[0]?.id ?? null);
    setSelectedSkillId(null);
  }

  function addSkill(categoryId: string, name: string) {
    setTree(prev => {
      const next = structuredClone(prev);
      const cat = next.categories.find(c => c.id === categoryId);
      if (!cat) return prev;
      const newSkill: Skill = {
        id: generateId('skill'),
        name,
        description: '',
        tags: [],
        isArchived: false,
        updatedAt: Date.now(),
        levels: [1,2,3,4,5].map((n) => ({
          level: n as 1|2|3|4|5,
          title: `Рівень ${n}`,
          tasks: []
        }))
      };
      cat.skills.push(newSkill);
      return next;
    });
  }

  function updateSkill(updated: Skill) {
    setTree(prev => {
      const next = structuredClone(prev);
      for (const cat of next.categories) {
        const idx = cat.skills.findIndex(s => s.id === updated.id);
        if (idx >= 0) {
          cat.skills[idx] = { ...updated, updatedAt: Date.now() };
          break;
        }
      }
      return next;
    });
  }

  function deleteSkill(skillId: string) {
    // Save for undo
    const skillData = tree.categories.flatMap(c => c.skills).find(s => s.id === skillId);
    const categoryId = tree.categories.find(c => c.skills.some(s => s.id === skillId))?.id;
    
    setTree(prev => {
      const next = structuredClone(prev);
      for (const cat of next.categories) {
        const before = cat.skills.length;
        cat.skills = cat.skills.filter(s => s.id !== skillId);
        if (cat.skills.length !== before) break;
      }
      return next;
    });
    
    if (skillData && categoryId) {
      undoManager.push({
        id: generateId('undo'),
        type: 'delete_skill',
        description: `Видалено навичку "${skillData.name}"`,
        data: { skill: skillData, categoryId },
        timestamp: Date.now()
      });
    }
    
    if (selectedSkillId === skillId) setSelectedSkillId(null);
  }

  function addCategory(name: string) {
    setTree(prev => {
      const next = structuredClone(prev);
      const newCat: Category = {
        id: generateId('cat'),
        name,
        skills: []
      };
      next.categories.push(newCat);
      return next;
    });
  }

  function renameCategory(categoryId: string, newName: string) {
    setTree(prev => {
      const next = structuredClone(prev);
      const cat = next.categories.find(c => c.id === categoryId);
      if (cat) cat.name = newName;
      return next;
    });
  }

  function deleteCategory(categoryId: string) {
    // Save for undo
    const categoryData = tree.categories.find(c => c.id === categoryId);
    
    setTree(prev => {
      const next = structuredClone(prev);
      next.categories = next.categories.filter(c => c.id !== categoryId);
      return next;
    });
    
    if (categoryData) {
      undoManager.push({
        id: generateId('undo'),
        type: 'delete_category',
        description: `Видалено категорію "${categoryData.name}" (${categoryData.skills.length} навичок)`,
        data: { category: categoryData },
        timestamp: Date.now()
      });
    }
    
    if (selectedCategoryId === categoryId) setSelectedCategoryId(tree.categories[0]?.id ?? null);
  }

  function moveSkillToCategory(skillId: string, targetCategoryId: string) {
    setTree(prev => {
      const next = structuredClone(prev);
      let skill: Skill | null = null;
      for (const cat of next.categories) {
        const idx = cat.skills.findIndex(s => s.id === skillId);
        if (idx >= 0) {
          skill = cat.skills.splice(idx, 1)[0];
          break;
        }
      }
      if (skill) {
        const targetCat = next.categories.find(c => c.id === targetCategoryId);
        if (targetCat) targetCat.skills.push(skill);
      }
      return next;
    });
  }

  function addFighter(name: string, initialLevels: FighterSkillLevels = {}, meta?: Partial<Fighter>) {
    const id = generateId('fighter');
    const levels: FighterSkillLevels = {};
    const xpBase: FighterXpLedger = {};
    for (const c of tree.categories) for (const s of c.skills) {
      const lvl = (initialLevels[s.id] ?? 0) as 0|1|2|3|4|5|6|7|8|9|10;
      levels[s.id] = lvl;
      xpBase[s.id] = xpThresholdForLevel(lvl);
    }
    setFighters(prev => [...prev, { id, name, ...meta }]);
    setFighterSkillLevels(prev => ({ ...prev, [id]: levels }));
    setXpLedger(prev => ({ ...prev, [id]: xpBase }));
  }

  function deleteFighter(fighterId: string) {
    // Save for undo
    const fighterData = fighters.find(f => f.id === fighterId);
    const fighterLevels = fighterSkillLevels[fighterId];
    const fighterXp = xpLedger[fighterId];
    const fighterSkillMap = fighterSkills[fighterId];

    setFighters(prev => prev.filter(f => f.id !== fighterId));
    setFighterSkillLevels(prev => {
      const next = { ...prev } as Record<string, FighterSkillLevels>;
      delete next[fighterId];
      return next;
    });
    setFighterSkills(prev => {
      const next = { ...prev } as Record<string, FighterSkills>;
      delete next[fighterId];
      return next;
    });

    if (fighterData) {
      undoManager.push({
        id: generateId('undo'),
        type: 'delete_fighter',
        description: `Видалено бійця "${fighterData.callsign || fighterData.name}"`,
        data: { fighter: fighterData, levels: fighterLevels, xp: fighterXp, skills: fighterSkillMap },
        timestamp: Date.now()
      });
    }
    setXpLedger(prev => {
      const next = { ...prev } as Record<string, FighterXpLedger>;
      delete next[fighterId];
      return next;
    });
    setTasksV2(prev => prev.map(t => ({ ...t, assignees: t.assignees.filter(a => a.fighterId !== fighterId) })));
  }

  // TaskV2 helpers
  function createTaskV2(payload: Omit<TaskV2, 'id'|'status'|'createdAt'|'submittedAt'|'approvedAt'|'taskNumber'|'history'|'comments'>) {
    const id = generateId('task');
    const nextNumber = tasksV2.reduce((max, task) => Math.max(max, task.taskNumber ?? 0), 0) + 1;
    const timestamp = Date.now();
    const task: TaskV2 = { id, status: 'todo', createdAt: timestamp, taskNumber: nextNumber, history: [{ fromStatus: null, toStatus: 'todo', changedAt: timestamp }], comments: [], ...payload };
    setTasksV2(prev => [task, ...prev]);
  }

  function updateTaskV2Status(taskId: string, status: TaskV2Status) {
    setTasksV2(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      if (t.status === status) return t;
      const timestamp = Date.now();
      const history = [...(t.history ?? []), { fromStatus: t.status, toStatus: status, changedAt: timestamp }];
      return {
        ...t,
        status,
        submittedAt: status === 'validation' ? timestamp : t.submittedAt,
        approvedAt: status === 'done' ? timestamp : t.approvedAt,
        history
      };
    }));
  }

  function updateTaskV2Details(taskId: string, updates: { title?: string; description?: string }) {
    setTasksV2(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const next = { ...t } as TaskV2;
      if (typeof updates.title === 'string') {
        next.title = updates.title;
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
        next.description = updates.description;
      }
      return next;
    }));
  }

  function approveTaskV2(taskId: string, approved: Record<string, Record<string, number>>) {
    // approved[fighterId][skillId] = xpApproved
    const task = tasksV2.find(t => t.id === taskId);
    if (!task) return;
    const timestamp = Date.now();
    setTasksV2(prev => prev.map(t => t.id === taskId ? {
      ...t,
      status: 'done',
      approvedAt: timestamp,
      history: [...(t.history ?? []), { fromStatus: t.status, toStatus: 'done', changedAt: timestamp }],
      assignees: t.assignees.map(a => ({
        ...a,
        skills: a.skills.map(s => ({ ...s, xpApproved: approved[a.fighterId]?.[s.skillId] ?? s.xpSuggested }))
      }))
    } : t));
    // Write XP to ledger, applying only the delta from previous approvals
    setXpLedger(prev => {
      const next = { ...prev } as Record<string, FighterXpLedger>;
      for (const a of task.assignees) {
        const ledger = { ...(next[a.fighterId] ?? {}) } as FighterXpLedger;
        for (const s of a.skills) {
          const previousApproved = Math.max(0, s.xpApproved ?? 0);
          const currentApproved = Math.max(0, approved[a.fighterId]?.[s.skillId] ?? s.xpSuggested);
          const currentLedgerValue = ledger[s.skillId] ?? 0;
          ledger[s.skillId] = Math.max(0, currentLedgerValue - previousApproved + currentApproved);
        }
        next[a.fighterId] = ledger;
      }
      return next;
    });
  }

  function deleteTaskV2(taskId: string) {
    // Save for undo
    const taskData = tasksV2.find(t => t.id === taskId);
    
    setTasksV2(prev => prev.filter(t => t.id !== taskId));
    
    if (taskData) {
      undoManager.push({
        id: generateId('undo'),
        type: 'delete_task',
        description: `Видалено задачу "${taskData.title}"`,
        data: { task: taskData },
        timestamp: Date.now()
      });
    }
  }

  function addTaskComment(taskId: string, message: string, author = 'Командир') {
    const trimmed = message.trim();
    if (!trimmed) return;
    const comment: TaskComment = { id: generateId('comment'), author, message: trimmed, createdAt: Date.now() };
    setTasksV2(prev => prev.map(t => t.id === taskId ? { ...t, comments: [...(t.comments ?? []), comment] } : t));
  }

  function performUndo(): string | null {
    const action = undoManager.pop();
    if (!action) return null;
    
    switch (action.type) {
      case 'delete_fighter': {
        const { fighter, levels, xp, skills } = action.data;
        setFighters(prev => [...prev, fighter]);
        setFighterSkillLevels(prev => ({ ...prev, [fighter.id]: levels }));
        setXpLedger(prev => ({ ...prev, [fighter.id]: xp }));
        if (skills) {
          setFighterSkills(prev => ({ ...prev, [fighter.id]: skills }));
        }
        break;
      }
      case 'delete_task': {
        const { task } = action.data;
        setTasksV2(prev => [task, ...prev]);
        break;
      }
      case 'delete_skill': {
        const { skill, categoryId } = action.data;
        setTree(prev => {
          const next = structuredClone(prev);
          const cat = next.categories.find(c => c.id === categoryId);
          if (cat) cat.skills.push(skill);
          return next;
        });
        setFighterSkills(prev => {
          const next = { ...prev } as Record<string, FighterSkills>;
          for (const [fid, skills] of Object.entries(next)) {
            if (skills && skill.id in skills) {
              skills[skill.id] = true;
            }
          }
          return next;
        });
        break;
      }
      case 'delete_category': {
        const { category } = action.data;
        setTree(prev => {
          const next = structuredClone(prev);
          next.categories.push(category);
          return next;
        });
        break;
      }
    }
    
    return action.description;
  }

  return {
    tree,
    profile,
    profiles: listProfiles(),
    mode,
    setMode,
    fighters,
    setFighters,
    selectedFighterId,
    setSelectedFighterId,
    tasks,
    setTasks,
    tasksV2,
    setTasksV2,
    xpLedger,
    setXpLedger,
    fighterSkillLevels,
    setFighterSkillLevels,
    fighterSkills,
    setFighterSkills,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSkillId,
    setSelectedSkillId,
    selectedCategory,
    selectedSkill,
    onResetToSeed,
    switchProfile,
    addSkill,
    updateSkill,
    deleteSkill,
    addCategory,
    renameCategory,
    deleteCategory,
    moveSkillToCategory,
    addFighter,
    deleteFighter,
    createTaskV2,
    updateTaskV2Status,
    updateTaskV2Details,
    approveTaskV2,
    deleteTaskV2,
    addTaskComment,
    performUndo,
    canUndo: undoManager.size > 0
  };
}
