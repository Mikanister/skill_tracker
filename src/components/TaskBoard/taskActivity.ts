import { TaskComment, TaskStatusHistoryEntry, TaskV2 } from '@/types';

export type TaskActivityEntry =
  | { type: 'status'; entry: TaskStatusHistoryEntry }
  | { type: 'comment'; entry: TaskComment };

export const buildTaskActivityEntries = (task: TaskV2 | null): TaskActivityEntry[] => {
  if (!task) return [];

  const historyEntries: TaskActivityEntry[] = (task.history ?? []).map(entry => ({ type: 'status', entry }));
  const commentEntries: TaskActivityEntry[] = (task.comments ?? []).map(entry => ({ type: 'comment', entry }));

  return [...historyEntries, ...commentEntries].sort((a, b) => {
    const timeA = a.type === 'status' ? a.entry.changedAt : a.entry.createdAt;
    const timeB = b.type === 'status' ? b.entry.changedAt : b.entry.createdAt;
    return timeB - timeA;
  });
};
