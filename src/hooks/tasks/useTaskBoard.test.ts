import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskBoard } from './useTaskBoard';
import type { TaskV2 } from '@/types';

const baseTask = (overrides: Partial<TaskV2> = {}): TaskV2 => ({
  id: 't1',
  title: 'Alpha task',
  status: 'todo',
  difficulty: 3,
  description: '',
  assignees: [],
  createdAt: 1,
  ...overrides
});

const tasks: TaskV2[] = [
  baseTask({ id: 't1', title: 'Search me', status: 'todo', taskNumber: 101, assignees: [{ fighterId: 'f1', skills: [] }] }),
  baseTask({ id: 't2', title: 'Other', status: 'in_progress', taskNumber: 202, assignees: [{ fighterId: 'f2', skills: [] }] }),
  baseTask({ id: 't3', title: 'Archived A', status: 'archived', approvedAt: 50 }),
  baseTask({ id: 't4', title: 'Archived B', status: 'archived', createdAt: 100 }),
  baseTask({ id: 't5', title: 'Validation task', status: 'validation' })
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTaskBoard', () => {
  it('filters tasks by assignee and groups them by status', () => {
    const onStatusChange = vi.fn();
    const { result } = renderHook(() => useTaskBoard({ tasks, onStatusChange }));

    expect(result.current.filteredTasks).toHaveLength(5);
    expect(result.current.byStatus.todo.map(t => t.id)).toEqual(['t1']);
    expect(result.current.byStatus.in_progress.map(t => t.id)).toEqual(['t2']);

    act(() => {
      result.current.setAssigneeFilter('f1');
    });

    expect(result.current.filteredTasks.map(t => t.id)).toEqual(['t1']);
    expect(result.current.byStatus.todo.map(t => t.id)).toEqual(['t1']);
    expect(result.current.byStatus.in_progress).toHaveLength(0);
  });

  it('sorts archived tasks by approvedAt/createdAt descending', () => {
    const onStatusChange = vi.fn();
    const { result } = renderHook(() => useTaskBoard({ tasks, onStatusChange }));

    expect(result.current.byStatus.archived.map(t => t.id)).toEqual(['t4', 't3']);
  });

  it('builds search suggestions by title and task number', () => {
    const onStatusChange = vi.fn();
    const { result } = renderHook(() => useTaskBoard({ tasks, onStatusChange }));

    act(() => {
      result.current.setSearchQuery('search');
    });
    expect(result.current.searchSuggestions.map(t => t.id)).toEqual(['t1']);

    act(() => {
      result.current.setSearchQuery('#202');
    });
    expect(result.current.searchSuggestions.map(t => t.id)).toEqual(['t2']);

    act(() => {
      result.current.setSearchQuery('');
    });
    expect(result.current.searchSuggestions).toHaveLength(0);
  });

  it('tracks selected task via openTask/openTaskById and closeTask', () => {
    const onStatusChange = vi.fn();
    const { result } = renderHook(() => useTaskBoard({ tasks, onStatusChange }));

    act(() => {
      result.current.openTask(tasks[1]);
    });

    expect(result.current.selectedTaskId).toBe('t2');
    expect(result.current.isTaskModalOpen).toBe(true);
    expect(result.current.selectedTask?.id).toBe('t2');

    act(() => {
      result.current.openTaskById('t1', { task: null });
    });

    expect(result.current.selectedTaskId).toBe('t1');
    expect(result.current.selectedTask?.id).toBe('t1');

    act(() => {
      result.current.closeTask();
    });

    expect(result.current.isTaskModalOpen).toBe(false);
    expect(result.current.selectedTaskId).toBeNull();
    expect(result.current.selectedTask).toBeNull();
  });

  it('toggles column expansion state', () => {
    const onStatusChange = vi.fn();
    const { result } = renderHook(() => useTaskBoard({ tasks, onStatusChange }));

    expect(result.current.expandedColumns.todo).toBe(false);

    act(() => {
      result.current.toggleColumnExpansion('todo');
    });

    expect(result.current.expandedColumns.todo).toBe(true);
  });

  it('handles drop for non-done target and avoids redundant calls', () => {
    const onStatusChange = vi.fn();
    const { result } = renderHook(() => useTaskBoard({ tasks, onStatusChange }));

    act(() => {
      result.current.setDraggedTaskId('t1');
    });
    act(() => {
      result.current.handleDrop('in_progress');
    });

    expect(onStatusChange).toHaveBeenCalledWith('t1', 'in_progress');

    act(() => {
      result.current.setDraggedTaskId('t2');
    });
    act(() => {
      result.current.handleDrop('in_progress');
    });

    expect(onStatusChange).toHaveBeenCalledTimes(1);
  });

  it('routes drop to validation when target is done and triggers onApproval', () => {
    const onStatusChange = vi.fn();
    const onApproval = vi.fn();
    const { result } = renderHook(() => useTaskBoard({ tasks, onStatusChange }));

    act(() => {
      result.current.setDraggedTaskId('t1');
    });
    act(() => {
      result.current.handleDrop('done', { onApproval });
    });

    expect(onStatusChange).toHaveBeenCalledWith('t1', 'validation');
    expect(onApproval).toHaveBeenCalledTimes(1);
    expect(onApproval.mock.calls[0][0]).toMatchObject({ id: 't1', status: 'validation' });
  });

  it('does not mutate status when dropping validation task into done', () => {
    const onStatusChange = vi.fn();
    const onApproval = vi.fn();
    const { result } = renderHook(() => useTaskBoard({ tasks, onStatusChange }));

    act(() => {
      result.current.setDraggedTaskId('t5');
    });
    act(() => {
      result.current.handleDrop('done', { onApproval });
    });

    expect(onStatusChange).not.toHaveBeenCalled();
    expect(onApproval).toHaveBeenCalledTimes(1);
    expect(onApproval.mock.calls[0][0]).toMatchObject({ id: 't5', status: 'validation' });
  });

  it('resets drag state when task not found or after drop', () => {
    const onStatusChange = vi.fn();
    const { result } = renderHook(() => useTaskBoard({ tasks, onStatusChange }));

    act(() => {
      result.current.setDraggedTaskId('missing');
    });
    act(() => {
      result.current.handleDrop('todo');
    });

    expect(result.current.draggedTaskId).toBeNull();
    expect(result.current.dropTargetStatus).toBeNull();

    act(() => {
      result.current.setDraggedTaskId('t1');
      result.current.setDropTargetStatus('in_progress');
    });
    act(() => {
      result.current.handleDrop('in_progress');
    });

    expect(result.current.draggedTaskId).toBeNull();
    expect(result.current.dropTargetStatus).toBeNull();
  });
});
