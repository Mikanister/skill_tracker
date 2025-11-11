import { UserTaskStatus } from '@/types';

export type NormalizedStatus = 'todo' | 'in_progress' | 'validation' | 'done';

export type StatusColumnDefinition = {
  key: NormalizedStatus;
  title: string;
};

export const STATUS_COLUMNS: StatusColumnDefinition[] = [
  { key: 'todo', title: 'To Do' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'validation', title: 'Validation' },
  { key: 'done', title: 'Done' }
];

export const normalizeStatus = (status?: UserTaskStatus): NormalizedStatus => {
  if (status === 'submitted') return 'validation';
  if (status === 'approved') return 'done';
  if (status === 'draft' || status === undefined) return 'todo';
  if (status === 'todo' || status === 'in_progress' || status === 'validation' || status === 'done') return status;
  return 'todo';
};
