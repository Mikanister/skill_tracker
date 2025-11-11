import { TaskV2 } from '@/types';
import { diminishingReturns } from './xp';

export function tokenize(text: string): Set<string> {
  const cleaned = (text || '').toLowerCase().replace(/[^a-zа-яіїє0-9\s]/gi, ' ');
  const tokens = cleaned.split(/\s+/).filter(token => token.length >= 3);
  return new Set(tokens);
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

export function countSimilarForTaskLine(
  tasks: TaskV2[],
  params: {
    fighterId: string;
    skillId: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    title?: string;
    windowDays?: number;
  }
): number {
  const { fighterId, skillId, difficulty, title = '', windowDays = 3 } = params;
  const now = Date.now();
  const titleTokens = tokenize(title);

  let count = 0;
  for (const task of tasks) {
    if (task.status !== 'done' && task.status !== 'validation') continue;
    const timestamp = task.approvedAt ?? task.submittedAt ?? task.createdAt;
    if (now - timestamp > windowDays * 86_400_000) continue;
    if (Math.abs(task.difficulty - difficulty) > 1) continue;

    const hasLine = task.assignees.some(assignee =>
      assignee.fighterId === fighterId && assignee.skills.some(skill => skill.skillId === skillId)
    );
    if (!hasLine) continue;

    const similarity = jaccard(titleTokens, tokenize(task.title || ''));
    if (similarity >= 0.5) count += 1;
  }

  return count;
}

export function repetitionFactorFromTasks(
  tasks: TaskV2[],
  params: {
    fighterId: string;
    skillId: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    title?: string;
    windowDays?: number;
    freeQuota?: number;
    step?: number;
    minFactor?: number;
  }
): { count: number; factor: number } {
  const count = countSimilarForTaskLine(tasks, params);
  const factor = diminishingReturns(
    count,
    params.freeQuota ?? 3,
    params.step ?? 0.1,
    params.minFactor ?? 0.5
  );
  return { count, factor };
}
