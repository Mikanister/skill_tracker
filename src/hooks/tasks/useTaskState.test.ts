import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Dispatch, SetStateAction } from 'react';
import { useTaskState } from './useTaskState';
import { UndoManager } from '@/lib/undo';
import type { FighterXpLedger } from '@/types';

type LedgerState = Record<string, FighterXpLedger>;

type SetLedger = Dispatch<SetStateAction<LedgerState>>;

type HookSetup = {
  ledger: LedgerState;
  setXpLedger: SetLedger;
  undoManager: UndoManager;
};

function createLedgerBridge(): HookSetup {
  const ledger: LedgerState = {};
  const setXpLedger: SetLedger = vi.fn(update => {
    const next = typeof update === 'function' ? update(ledger) : update;
    const normalized = next ?? {};
    Object.keys(ledger).forEach(key => {
      if (!(key in (normalized as Record<string, unknown>))) {
        delete ledger[key];
      }
    });
    Object.assign(ledger, normalized);
    return undefined;
  });
  const undoManager = new UndoManager();
  return { ledger, setXpLedger, undoManager };
}

function setupHook() {
  const { ledger, setXpLedger, undoManager } = createLedgerBridge();
  const hook = renderHook(() => useTaskState({ setXpLedger, undoManager }));
  return { hook, ledger, setXpLedger, undoManager };
}

describe('useTaskState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates tasks with defaults and updates details', () => {
    const { hook } = setupHook();
    const { result } = hook;
    const initialTime = Date.now();

    act(() => {
      result.current.createTask({
        title: 'New task',
        description: 'Initial',
        difficulty: 3,
        assignees: []
      });
    });

    expect(result.current.tasks).toHaveLength(1);
    const task = result.current.tasks[0];
    expect(task.status).toBe('todo');
    expect(task.createdAt).toBe(initialTime);
    expect(task.history).toEqual([
      { fromStatus: null, toStatus: 'todo', changedAt: initialTime }
    ]);
    expect(task.isPriority).toBe(false);

    act(() => {
      result.current.updateTaskDetails(task.id, {
        title: 'Updated',
        description: '',
        isPriority: true,
        difficulty: 4
      });
    });

    const updated = result.current.tasks[0];
    expect(updated.title).toBe('Updated');
    expect(updated.description).toBe('');
    expect(updated.isPriority).toBe(true);
    expect(updated.difficulty).toBe(4);
  });

  it('updates status history and approves tasks updating ledger', () => {
    const { hook, ledger, setXpLedger } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Task',
        description: '',
        difficulty: 3,
        assignees: [{
          fighterId: 'f1',
          skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 100 }]
        }]
      });
    });

    const taskId = result.current.tasks[0].id;

    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
    const statusTime = Date.now();
    act(() => {
      result.current.updateTaskStatus(taskId, 'validation');
    });

    const validationTask = result.current.tasks[0];
    expect(validationTask.status).toBe('validation');
    expect(validationTask.submittedAt).toBe(statusTime);
    expect(validationTask.history?.at(-1)).toEqual({
      fromStatus: 'todo',
      toStatus: 'validation',
      changedAt: statusTime
    });

    vi.setSystemTime(new Date('2024-01-03T00:00:00Z'));
    const approvalTime = Date.now();
    act(() => {
      result.current.approveTask(taskId, { f1: { s1: 150 } });
    });

    expect(setXpLedger).toBeCalledTimes(1);
    expect(ledger.f1?.s1).toBe(150);

    const approvedTask = result.current.tasks[0];
    expect(approvedTask.status).toBe('done');
    expect(approvedTask.approvedAt).toBe(approvalTime);
    expect(approvedTask.assignees[0].skills[0].xpApproved).toBe(150);
    expect(approvedTask.history?.at(-1)).toEqual({
      fromStatus: 'validation',
      toStatus: 'done',
      changedAt: approvalTime
    });
  });

  it('trims comments, marks them read, and records deletions in undo manager', () => {
    const { hook, undoManager } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Task',
        description: '',
        difficulty: 3,
        assignees: []
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addTaskComment(taskId, '  hello  ');
    });

    let task = result.current.tasks[0];
    expect(task.comments).toHaveLength(1);
    expect(task.comments?.[0].message).toBe('hello');
    expect(task.hasUnreadComments).toBe(true);

    vi.setSystemTime(new Date('2024-01-04T00:00:00Z'));
    const readTime = Date.now();
    act(() => {
      result.current.markTaskCommentsRead(taskId);
    });

    task = result.current.tasks[0];
    expect(task.hasUnreadComments).toBe(false);
    expect(task.comments?.[0].readAt).toBe(readTime);

    act(() => {
      result.current.deleteTask(taskId);
    });

    expect(result.current.tasks).toHaveLength(0);
    const undoAction = undoManager.pop();
    expect(undoAction?.type).toBe('delete_task');
    expect(undoAction?.data.task.id).toBe(taskId);
  });

  it('assigns sequential task numbers and ignores redundant status updates', () => {
    const { hook } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'First',
        description: '',
        difficulty: 2,
        assignees: []
      });
    });
    const firstTask = result.current.tasks[0];
    expect(firstTask.taskNumber).toBe(1);

    act(() => {
      result.current.updateTaskStatus(firstTask.id, 'todo');
    });
    expect(result.current.tasks[0]).toBe(firstTask);
    expect(result.current.tasks[0].history).toHaveLength(1);

    act(() => {
      result.current.createTask({
        title: 'Second',
        description: '',
        difficulty: 3,
        assignees: []
      });
    });
    const numbers = result.current.tasks.map(task => task.taskNumber);
    expect(numbers).toEqual(expect.arrayContaining([1, 2]));
  });

  it('ignores empty detail updates and leaves other tasks untouched', () => {
    const { hook } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Persistent',
        description: 'keep',
        difficulty: 2,
        assignees: []
      });
      result.current.createTask({
        title: 'Latest',
        description: '',
        difficulty: 4,
        assignees: []
      });
    });

    const [latestTask, earlierTask] = result.current.tasks;
    const untouchedReference = earlierTask;

    act(() => {
      result.current.updateTaskDetails(latestTask.id, {});
    });

    const afterEmptyUpdates = result.current.tasks[0];
    expect(afterEmptyUpdates.title).toBe('Latest');
    expect(afterEmptyUpdates.description).toBe('');
    expect(afterEmptyUpdates.isPriority).toBe(false);
    expect(afterEmptyUpdates.difficulty).toBe(4);
    expect(result.current.tasks[1]).toBe(untouchedReference);

    act(() => {
      result.current.updateTaskDetails(latestTask.id, { difficulty: undefined as unknown as 1 });
    });
    expect(result.current.tasks[0].difficulty).toBe(4);

    act(() => {
      result.current.updateTaskStatus(latestTask.id, 'in_progress');
    });
    expect(result.current.tasks[1]).toBe(untouchedReference);
  });

  it('approves using suggested XP when override is missing', () => {
    const { hook, ledger } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Approval task',
        description: '',
        difficulty: 3,
        assignees: [{
          fighterId: 'f1',
          skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 25 }]
        }]
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.approveTask(taskId, { f1: {} });
    });

    const approved = result.current.tasks[0];
    expect(approved.assignees[0].skills[0].xpApproved).toBe(25);
    expect(ledger.f1?.s1).toBe(25);
  });

  it('ignores blank task comments', () => {
    const { hook } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Comment target',
        description: '',
        difficulty: 2,
        assignees: []
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addTaskComment(taskId, '   ');
    });

    const task = result.current.tasks[0];
    expect(task.comments).toHaveLength(0);
    expect(task.hasUnreadComments).toBe(false);
  });

  it('adjusts XP ledger when approving multiple times and no-ops for unknown task', () => {
    const { hook, ledger, setXpLedger } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Task',
        description: '',
        difficulty: 3,
        assignees: [{ fighterId: 'f1', skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 40, xpApproved: 10 }] }]
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.approveTask(taskId, { f1: { s1: 50 } });
    });
    expect(ledger.f1?.s1).toBe(40);

    act(() => {
      result.current.approveTask(taskId, { f1: { s1: 20 } });
    });
    expect(ledger.f1?.s1).toBe(10);

    vi.mocked(setXpLedger).mockClear();
    const snapshot = JSON.stringify(ledger);
    act(() => {
      result.current.approveTask('missing', { f1: { s1: 10 } });
    });
    expect(setXpLedger).not.toHaveBeenCalled();
    expect(JSON.stringify(ledger)).toBe(snapshot);
  });

  it('handles redundant comment read operations without mutating task', () => {
    const { hook } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Task',
        description: '',
        difficulty: 2,
        assignees: []
      });
    });
    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.addTaskComment(taskId, 'note');
      result.current.markTaskCommentsRead(taskId);
    });

    const firstSnapshot = result.current.tasks[0];
    act(() => {
      result.current.markTaskCommentsRead(taskId);
    });
    expect(result.current.tasks[0]).toBe(firstSnapshot);
  });

  it('unsets hasUnreadComments when comments already marked read', () => {
    const { hook } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Task',
        description: '',
        difficulty: 2,
        assignees: []
      });
    });

    const taskId = result.current.tasks[0].id;

    const unreadTask = {
      ...result.current.tasks[0],
      hasUnreadComments: true,
      comments: [{ id: 'c1', author: 'A', message: 'hi', createdAt: 1, readAt: 10 }]
    } as any;

    act(() => {
      result.current.setTasks([unreadTask]);
    });

    act(() => {
      result.current.markTaskCommentsRead(taskId);
    });

    const updated = result.current.tasks[0];
    expect(updated.hasUnreadComments).toBe(false);
    expect(updated.comments?.[0].readAt).toBe(10);
  });

  it('marks unread comments and sets readAt timestamps', () => {
    const { hook } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Task',
        description: '',
        difficulty: 2,
        assignees: []
      });
    });

    const taskId = result.current.tasks[0].id;
    const unreadComment = { id: 'c1', author: 'A', message: 'hi', createdAt: 1 };

    act(() => {
      result.current.setTasks([{
        ...result.current.tasks[0],
        hasUnreadComments: true,
        comments: [unreadComment]
      } as any]);
    });

    vi.setSystemTime(new Date('2024-01-05T00:00:00Z'));
    const readTime = Date.now();

    act(() => {
      result.current.markTaskCommentsRead(taskId);
    });

    const updated = result.current.tasks[0];
    expect(updated.hasUnreadComments).toBe(false);
    expect(updated.comments?.[0].readAt).toBe(readTime);
  });

  it('leaves other tasks untouched when marking comments', () => {
    const { hook } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'First',
        description: '',
        difficulty: 2,
        assignees: []
      });
      result.current.createTask({
        title: 'Second',
        description: '',
        difficulty: 3,
        assignees: []
      });
    });

    const [latestTask, otherTask] = result.current.tasks;

    act(() => {
      result.current.setTasks([{
        ...latestTask,
        hasUnreadComments: true,
        comments: [{ id: 'c1', author: 'A', message: 'hi', createdAt: 1 }]
      } as any, otherTask]);
    });

    const untouchedReference = result.current.tasks[1];

    act(() => {
      result.current.markTaskCommentsRead(latestTask.id);
    });

    expect(result.current.tasks[1]).toBe(untouchedReference);
  });

  it('returns original task when no unread comments present', () => {
    const { hook } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Task',
        description: '',
        difficulty: 2,
        assignees: []
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.setTasks([{
        ...result.current.tasks[0],
        hasUnreadComments: false,
        comments: undefined
      } as any]);
    });

    const snapshot = result.current.tasks[0];

    act(() => {
      result.current.markTaskCommentsRead(taskId);
    });

    expect(result.current.tasks[0]).toBe(snapshot);
  });

  it('ignores delete calls for missing task ids', () => {
    const { hook, undoManager } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.deleteTask('missing');
    });

    expect(undoManager.pop()).toBeUndefined();
  });

  it('deletes task and pushes undo entry when task exists', () => {
    const { hook, undoManager } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'Task',
        description: '',
        difficulty: 2,
        assignees: []
      });
    });

    const task = result.current.tasks[0];

    act(() => {
      result.current.deleteTask(task.id);
    });

    expect(result.current.tasks).toHaveLength(0);
    const undoEntry = undoManager.pop();
    expect(undoEntry).toMatchObject({ type: 'delete_task', data: { task: expect.objectContaining({ id: task.id }) } });
  });

  it('updates task assignees preserving existing entries and adding new ones', () => {
    const { hook } = setupHook();
    const { result } = hook;

    act(() => {
      result.current.createTask({
        title: 'With assignees',
        description: '',
        difficulty: 3,
        assignees: [
          {
            fighterId: 'f1',
            skills: [{ skillId: 's1', categoryId: 'c1', xpSuggested: 10 }]
          },
          {
            fighterId: 'f2',
            skills: [{ skillId: 's2', categoryId: 'c2', xpSuggested: 20 }]
          }
        ]
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.updateTaskAssignees(taskId, ['f2', 'f3']);
    });

    const updated = result.current.tasks[0];
    const ids = updated.assignees.map(a => a.fighterId).sort();
    expect(ids).toEqual(['f2', 'f3']);

    const f2Assignee = updated.assignees.find(a => a.fighterId === 'f2');
    expect(f2Assignee?.skills).toEqual([
      { skillId: 's2', categoryId: 'c2', xpSuggested: 20 }
    ]);

    const f3Assignee = updated.assignees.find(a => a.fighterId === 'f3');
    expect(f3Assignee).toBeDefined();
    expect(f3Assignee?.skills).toEqual([]);
  });
});
