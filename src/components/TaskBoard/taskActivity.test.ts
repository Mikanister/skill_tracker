import { describe, it, expect } from 'vitest';
import { buildTaskActivityEntries } from './taskActivity';
import { TaskV2 } from '@/types';

describe('buildTaskActivityEntries', () => {
  const baseTask: TaskV2 = {
    id: 't1',
    title: 'Test',
    description: 'Desc',
    difficulty: 1,
    assignees: [],
    status: 'todo',
    createdAt: 1,
    taskNumber: 1,
    history: [
      { fromStatus: null, toStatus: 'todo', changedAt: 1 },
      { fromStatus: 'todo', toStatus: 'in_progress', changedAt: 3 }
    ],
    comments: [
      { id: 'c1', author: 'User', message: 'Hello', createdAt: 2 },
      { id: 'c2', author: 'User', message: 'Later comment', createdAt: 4 }
    ],
    isPriority: false
  };

  it('merges history and comments sorted descending by timestamp', () => {
    const entries = buildTaskActivityEntries(baseTask);
    expect(entries).toHaveLength(4);
    expect(entries.map(entry => entry.type)).toEqual(['comment', 'status', 'comment', 'status']);
    expect(entries[0].type).toBe('comment');
    if (entries[0].type === 'comment') {
      expect(entries[0].entry.id).toBe('c2');
    }
  });

  it('returns empty array when task is null', () => {
    expect(buildTaskActivityEntries(null)).toEqual([]);
  });

  it('handles missing history or comments', () => {
    const taskWithoutHistory = { ...baseTask, history: undefined };
    const entries = buildTaskActivityEntries(taskWithoutHistory);
    expect(entries).toHaveLength(2);
    expect(entries.every(entry => entry.type === 'comment')).toBe(true);
  });
});
