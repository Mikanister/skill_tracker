import { useEffect, useRef, useState } from 'react';
import { Mode, FighterSkills } from './types';
import { UndoManager } from './lib/undo';
import { useTaskState } from './hooks/useTaskState';
import { useFighterState } from './hooks/useFighterState';
import { useSkillTreeState } from './hooks/useSkillTreeState';

export function useSkillRpgState() {
  const [undoManager] = useState(() => new UndoManager());
  const [mode, setMode] = useState<Mode>('view');

  const {
    tree,
    profile,
    profiles,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSkillId,
    setSelectedSkillId,
    selectedCategory,
    selectedSkill,
    addSkill,
    updateSkill,
    deleteSkill,
    addCategory,
    renameCategory,
    deleteCategory,
    moveSkillToCategory,
    onResetToSeed,
    switchProfile,
    restoreSkill,
    restoreCategory
  } = useSkillTreeState({ undoManager });

  const removeAssignmentsRef = useRef<((fighterId: string) => void) | null>(null);

  const {
    fighters,
    setFighters,
    selectedFighterId,
    setSelectedFighterId,
    xpLedger,
    setXpLedger,
    fighterSkillLevels,
    setFighterSkillLevels,
    fighterSkills,
    setFighterSkills,
    addFighter,
    deleteFighter
  } = useFighterState({
    tree,
    undoManager,
    onRemoveFighterAssignments: fighterId => {
      removeAssignmentsRef.current?.(fighterId);
    }
  });

  const {
    tasks: tasksV2,
    setTasks: setTasksV2,
    createTask: createTaskV2,
    updateTaskStatus: updateTaskV2Status,
    updateTaskDetails: updateTaskV2Details,
    updateTaskAssignees: updateTaskV2Assignees,
    approveTask: approveTaskV2,
    deleteTask: deleteTaskV2,
    addTaskComment,
    markTaskCommentsRead
  } = useTaskState({ setXpLedger, undoManager });

  useEffect(() => {
    removeAssignmentsRef.current = fighterId => {
      setTasksV2(prev => prev.map(task => ({
        ...task,
        assignees: task.assignees.filter(assignee => assignee.fighterId !== fighterId)
      })));
    };

    return () => {
      removeAssignmentsRef.current = null;
    };
  }, [setTasksV2]);

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
        restoreSkill(skill, categoryId);
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
        restoreCategory(category);
        break;
      }
    }

    return action.description;
  }

  return {
    tree,
    profile,
    profiles,
    mode,
    setMode,
    fighters,
    setFighters,
    selectedFighterId,
    setSelectedFighterId,
    tasksV2,
    setTasksV2,
    createTaskV2,
    updateTaskV2Status,
    updateTaskV2Details,
    updateTaskV2Assignees,
    approveTaskV2,
    deleteTaskV2,
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
    addTaskComment,
    markTaskCommentsRead,
    performUndo,
    canUndo: undoManager.size > 0
  };
}
