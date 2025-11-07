import { Category, Skill, TaskV2 } from './types';

export function getSkillProgress(skill: Skill) {
  const total = skill.levels.reduce((acc, l) => acc + l.tasks.length, 0);
  const done = skill.levels.reduce((acc, l) => acc + l.tasks.filter(t => t.done).length, 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

export function getCategoryProgress(category: Category) {
  const skills = category.skills.filter(s => !s.isArchived);
  if (skills.length === 0) return { total: 0, done: 0, pct: 0 };
  const totals = skills.map(getSkillProgress);
  const total = totals.reduce((a, b) => a + b.total, 0);
  const done = totals.reduce((a, b) => a + b.done, 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

export function formatDate(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString();
}

// XP thresholds for levels 0..10 (inclusive) — slowed progression
// Index = level, value = minimum XP required to reach that level
const XP_THRESHOLDS: number[] = [
  0,    // 0
  40,   // 1
  120,  // 2
  240,  // 3
  400,  // 4
  600,  // 5
  900,  // 6
  1300, // 7
  1800, // 8
  2400, // 9
  3000  // 10
];

export function xpThresholdForLevel(level: 0|1|2|3|4|5|6|7|8|9|10): number {
  return XP_THRESHOLDS[level] ?? 0;
}

export function levelFromXp(xp: number): 0|1|2|3|4|5|6|7|8|9|10 {
  let lvl: 0|1|2|3|4|5|6|7|8|9|10 = 0;
  for (let i = 0 as 0|1|2|3|4|5|6|7|8|9|10; i <= 10; i = (i + 1) as any) {
    if (xp >= XP_THRESHOLDS[i]) lvl = i;
  }
  return lvl;
}

// Base XP by task difficulty (1..5) — slowed pace
export const BASE_XP_BY_DIFFICULTY: Record<1|2|3|4|5, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 25
};

// Clamp total modifier to a sane range
export function clampModifier(mod: number, min = 0.7, max = 1.4): number {
  return Math.max(min, Math.min(max, mod));
}

// Diminishing returns for repetitive tasks (anti-exploit)
// countWithinWindow: number of similar tasks approved within the time window (including current)
// After a free quota, each extra task reduces effectiveness slightly
export function diminishingReturns(countWithinWindow: number, freeQuota = 3, step = 0.1, minFactor = 0.5): number {
  if (countWithinWindow <= freeQuota) return 1;
  const penalty = (countWithinWindow - freeQuota) * step;
  return Math.max(minFactor, 1 - penalty);
}

// Compute suggested XP for a single fighter-skill
// difficulty: 1..5
// isNovice: level 0..1
// challenge: 0..0.3 (extra challenge factor)
// qualityAdj: -0.2..+0.2 (quality/time based)
// repetitionCount: number of similar tasks within window (for anti-exploit)
export function computeSuggestedXp(params: {
  difficulty: 1|2|3|4|5;
  isNovice?: boolean;
  challenge?: number; // 0..0.3
  qualityAdj?: number; // -0.2..+0.2
  repetitionCount?: number;
}): number {
  const { difficulty, isNovice = false, challenge = 0, qualityAdj = 0, repetitionCount = 1 } = params;
  const base = BASE_XP_BY_DIFFICULTY[difficulty];
  const noviceBoost = isNovice ? 0.2 : 0;
  const mod = clampModifier(1 + noviceBoost + challenge + qualityAdj);
  const antiExploit = diminishingReturns(repetitionCount);
  return Math.round(base * mod * antiExploit);
}

// --- Similarity helpers for anti-exploit ---
export function tokenize(text: string): Set<string> {
  const cleaned = (text || '').toLowerCase().replace(/[^a-zа-яіїє0-9\s]/gi, ' ');
  const tokens = cleaned.split(/\s+/).filter(t => t.length >= 3);
  return new Set(tokens);
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const uni = a.size + b.size - inter;
  return uni === 0 ? 1 : inter / uni;
}

// Count similar occurrences within windowDays for a given fighter-skill line
export function countSimilarForTaskLine(tasks: TaskV2[], params: {
  fighterId: string;
  skillId: string;
  difficulty: 1|2|3|4|5;
  title?: string;
  windowDays?: number;
}): number {
  const { fighterId, skillId, difficulty, title = '', windowDays = 3 } = params;
  const now = Date.now();
  const titleTokens = tokenize(title);
  let count = 0;
  for (const t of tasks) {
    if (t.status !== 'done' && t.status !== 'validation') continue;
    const ts = t.approvedAt ?? t.submittedAt ?? t.createdAt;
    if (now - ts > windowDays * 86400000) continue;
    if (Math.abs(t.difficulty - difficulty) > 1) continue;
    const hasLine = t.assignees.some(a => a.fighterId === fighterId && a.skills.some(s => s.skillId === skillId));
    if (!hasLine) continue;
    const sim = jaccard(titleTokens, tokenize(t.title || ''));
    if (sim >= 0.5) count++;
  }
  return count;
}

export function repetitionFactorFromTasks(tasks: TaskV2[], params: {
  fighterId: string;
  skillId: string;
  difficulty: 1|2|3|4|5;
  title?: string;
  windowDays?: number;
  freeQuota?: number;
  step?: number;
  minFactor?: number;
}): { count: number; factor: number } {
  const count = countSimilarForTaskLine(tasks, params);
  const factor = diminishingReturns(count, params.freeQuota ?? 3, params.step ?? 0.1, params.minFactor ?? 0.5);
  return { count, factor };
}

