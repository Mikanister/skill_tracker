import { Fighter, TaskV2 } from '../types';

export type SortOption<T> = {
  label: string;
  compareFn: (a: T, b: T) => number;
};

export const fighterSortOptions: SortOption<Fighter>[] = [
  {
    label: 'За іменем (А-Я)',
    compareFn: (a, b) => (a.callsign || a.name).localeCompare(b.callsign || b.name)
  },
  {
    label: 'За іменем (Я-А)',
    compareFn: (a, b) => (b.callsign || b.name).localeCompare(a.callsign || a.name)
  }
];

export const taskSortOptions: SortOption<TaskV2>[] = [
  {
    label: 'Нові спочатку',
    compareFn: (a, b) => b.createdAt - a.createdAt
  },
  {
    label: 'Старі спочатку',
    compareFn: (a, b) => a.createdAt - b.createdAt
  },
  {
    label: 'За складністю (↑)',
    compareFn: (a, b) => a.difficulty - b.difficulty
  },
  {
    label: 'За складністю (↓)',
    compareFn: (a, b) => b.difficulty - a.difficulty
  }
];
