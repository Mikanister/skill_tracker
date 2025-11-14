import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { FighterXpLedger, TaskComment, TaskV2, TaskV2Assignee, TaskV2Status } from '@/types';
import { safeGetItem, safeSetItem, generateId } from '@/lib/storage';
import { parseTasksV2 } from '@/utils/storageAdapters';
import { UndoManager } from '@/lib/undo';

/**
 * Configuration for {@link useTaskState}. Consumers provide undo integration and XP ledger bridge.
 */
export type UseTaskStateArgs = {
  setXpLedger: Dispatch<SetStateAction<Record<string, FighterXpLedger>>>;
  undoManager: UndoManager;
};

/**
 * Public API returned from {@link useTaskState} for managing task lifecycle and comments.
 */
export type UseTaskState = {
  tasks: TaskV2[];
  setTasks: Dispatch<SetStateAction<TaskV2[]>>;
  createTask: (payload: Omit<TaskV2, 'id' | 'status' | 'createdAt' | 'submittedAt' | 'approvedAt' | 'taskNumber' | 'history' | 'comments' | 'hasUnreadComments'>) => void;
  updateTaskStatus: (taskId: string, status: TaskV2Status) => void;
  updateTaskDetails: (taskId: string, updates: { title?: string; description?: string; isPriority?: boolean; difficulty?: 1 | 2 | 3 | 4 | 5 }) => void;
  updateTaskAssignees: (taskId: string, fighterIds: string[]) => void;
  approveTask: (taskId: string, approved: Record<string, Record<string, number>>) => void;
  deleteTask: (taskId: string) => void;
  addTaskComment: (taskId: string, message: string, author?: string) => void;
  markTaskCommentsRead: (taskId: string) => void;
};

/**
 * Manages the canonical task collection, persisting to localStorage and syncing XP ledger updates.
 */
export function useTaskState({ setXpLedger, undoManager }: UseTaskStateArgs): UseTaskState {
  const [tasks, setTasks] = useState<TaskV2[]>(() =>
    safeGetItem('skillrpg_tasks_v2', [], data => parseTasksV2(data, []))
  );

  useEffect(() => {
    safeSetItem('skillrpg_tasks_v2', tasks);
  }, [tasks]);

  function createTask(
    payload: Omit<TaskV2, 'id' | 'status' | 'createdAt' | 'submittedAt' | 'approvedAt' | 'taskNumber' | 'history' | 'comments' | 'hasUnreadComments'>
  ) {
    const timestamp = Date.now();
    setTasks(prev => {
      const nextNumber = prev.reduce((max, task) => Math.max(max, task.taskNumber ?? 0), 0) + 1;
      const task: TaskV2 = {
        id: generateId('task'),
        status: 'todo',
        createdAt: timestamp,
        taskNumber: nextNumber,
        history: [{ fromStatus: null, toStatus: 'todo', changedAt: timestamp }],
        comments: [],
        hasUnreadComments: false,
        ...payload,
        isPriority: payload.isPriority ?? false
      };
      return [task, ...prev];
    });
  }

  function updateTaskStatus(taskId: string, status: TaskV2Status) {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task;
        if (task.status === status) return task;
        const timestamp = Date.now();
        const history = [...(task.history ?? []), { fromStatus: task.status, toStatus: status, changedAt: timestamp }];
        return {
          ...task,
          status,
          submittedAt: status === 'validation' ? timestamp : task.submittedAt,
          approvedAt: status === 'done' ? timestamp : task.approvedAt,
          history
        };
      })
    );
  }

  function updateTaskAssignees(taskId: string, fighterIds: string[]) {
    const targetIds = new Set(fighterIds);
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task;
        const existing: TaskV2Assignee[] = [];
        const existingIds = new Set<string>();
        for (const assignee of task.assignees) {
          if (targetIds.has(assignee.fighterId)) {
            existing.push(assignee);
            existingIds.add(assignee.fighterId);
          }
        }
        const created: TaskV2Assignee[] = [];
        for (const fighterId of targetIds) {
          if (!existingIds.has(fighterId)) {
            created.push({ fighterId, skills: [] });
          }
        }
        return {
          ...task,
          assignees: [...existing, ...created]
        };
      })
    );
  }

  function updateTaskDetails(taskId: string, updates: { title?: string; description?: string; isPriority?: boolean; difficulty?: 1 | 2 | 3 | 4 | 5 }) {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task;
        const next: TaskV2 = { ...task };
        if (typeof updates.title === 'string') {
          next.title = updates.title;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
          next.description = updates.description;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'isPriority')) {
          next.isPriority = !!updates.isPriority;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'difficulty') && updates.difficulty) {
          next.difficulty = updates.difficulty;
        }
        return next;
      })
    );
  }

  function approveTask(taskId: string, approved: Record<string, Record<string, number>>) {
    const currentTask = tasks.find(task => task.id === taskId);
    if (!currentTask) return;

    const timestamp = Date.now();
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          status: 'done',
          approvedAt: timestamp,
          history: [...(task.history ?? []), { fromStatus: task.status, toStatus: 'done', changedAt: timestamp }],
          assignees: task.assignees.map(assignee => ({
            ...assignee,
            skills: assignee.skills.map(skill => ({
              ...skill,
              xpApproved: approved[assignee.fighterId]?.[skill.skillId] ?? skill.xpSuggested
            }))
          }))
        };
      })
    );

    setXpLedger(prev => {
      const next = { ...prev } as Record<string, FighterXpLedger>;
      for (const assignee of currentTask.assignees) {
        const ledger = { ...(next[assignee.fighterId] ?? {}) } as FighterXpLedger;
        for (const skill of assignee.skills) {
          const previousApproved = Math.max(0, skill.xpApproved ?? 0);
          const currentApproved = Math.max(0, approved[assignee.fighterId]?.[skill.skillId] ?? skill.xpSuggested);
          const currentLedgerValue = ledger[skill.skillId] ?? 0;
          ledger[skill.skillId] = Math.max(0, currentLedgerValue - previousApproved + currentApproved);
        }
        next[assignee.fighterId] = ledger;
      }
      return next;
    });
  }

  function deleteTask(taskId: string) {
    const taskData = tasks.find(task => task.id === taskId);

    setTasks(prev => prev.filter(task => task.id !== taskId));

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
    const comment: TaskComment = {
      id: generateId('comment'),
      author,
      message: trimmed,
      createdAt: Date.now()
    };
    setTasks(prev =>
      prev.map(task => (task.id === taskId
        ? {
            ...task,
            comments: [...(task.comments ?? []), comment],
            hasUnreadComments: true
          }
        : task))
    );
  }

  function markTaskCommentsRead(taskId: string) {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task;
        const comments = task.comments ?? [];
        const unreadExists = task.hasUnreadComments || comments.some(comment => !comment.readAt);
        if (!unreadExists) return task.hasUnreadComments ? { ...task, hasUnreadComments: false } : task;
        const now = Date.now();
        const nextComments = comments.map(comment => (comment.readAt ? comment : { ...comment, readAt: now }));
        return {
          ...task,
          comments: nextComments,
          hasUnreadComments: false
        };
      })
    );
  }

  return {
    tasks,
    setTasks,
    createTask,
    updateTaskStatus,
    updateTaskDetails,
    updateTaskAssignees,
    approveTask,
    deleteTask,
    addTaskComment,
    markTaskCommentsRead
  };
}
