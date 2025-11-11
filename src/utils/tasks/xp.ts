export const XP_THRESHOLDS: number[] = [
  0, // 0
  40, // 1
  120, // 2
  240, // 3
  400, // 4
  600, // 5
  900, // 6
  1300, // 7
  1800, // 8
  2400, // 9
  3000 // 10
];

export function xpThresholdForLevel(level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10): number {
  return XP_THRESHOLDS[level] ?? 0;
}

export function levelFromXp(xp: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 {
  let lvl: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 = 0;
  for (let i = 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; i <= 10; i = ((i + 1) as unknown) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) {
    if (xp >= XP_THRESHOLDS[i]) {
      lvl = i;
    }
  }
  return lvl;
}

export const BASE_XP_BY_DIFFICULTY: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 25
};

export function clampModifier(mod: number, min = 0.7, max = 1.4): number {
  return Math.max(min, Math.min(max, mod));
}

export function diminishingReturns(
  countWithinWindow: number,
  freeQuota = 3,
  step = 0.1,
  minFactor = 0.5
): number {
  if (countWithinWindow <= freeQuota) return 1;
  const penalty = (countWithinWindow - freeQuota) * step;
  return Math.max(minFactor, 1 - penalty);
}

export function computeSuggestedXp(params: {
  difficulty: 1 | 2 | 3 | 4 | 5;
  isNovice?: boolean;
  challenge?: number;
  qualityAdj?: number;
  repetitionCount?: number;
}): number {
  const { difficulty, isNovice = false, challenge = 0, qualityAdj = 0, repetitionCount = 1 } = params;
  const base = BASE_XP_BY_DIFFICULTY[difficulty];
  const noviceBoost = isNovice ? 0.2 : 0;
  const mod = clampModifier(1 + noviceBoost + challenge + qualityAdj);
  const antiExploit = diminishingReturns(repetitionCount);
  return Math.round(base * mod * antiExploit);
}
