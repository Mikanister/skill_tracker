import type {
  Fighter,
  FighterSkillLevels,
  FighterSkills,
  FighterXpLedger,
  SkillTree,
  TaskV2
} from '../types';

const isNonNullObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const warn = (message: string) => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn(`[storageAdapters] ${message}`);
  }
};

export function isFighter(value: unknown): value is Fighter {
  if (!isNonNullObject(value)) return false;
  return typeof value.id === 'string' && typeof value.name === 'string';
}

export function isFightersArray(value: unknown): value is Fighter[] {
  return Array.isArray(value) && value.every(isFighter);
}

export function isTaskV2(value: unknown): value is TaskV2 {
  if (!isNonNullObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    Array.isArray(value.assignees)
  );
}

export function isTasksV2Array(value: unknown): value is TaskV2[] {
  return Array.isArray(value) && value.every(isTaskV2);
}

export function isSkillTree(value: unknown): value is SkillTree {
  if (!isNonNullObject(value)) return false;
  return (
    Array.isArray(value.categories) &&
    typeof value.version === 'number'
  );
}

export function isFighterXpLedgerRecord(value: unknown): value is Record<string, FighterXpLedger> {
  if (!isNonNullObject(value)) return false;
  return Object.values(value).every(ledger => {
    if (!isNonNullObject(ledger)) return false;
    return Object.values(ledger).every(entry => typeof entry === 'number' && Number.isFinite(entry));
  });
}

export function isFighterSkillLevelsRecord(value: unknown): value is Record<string, FighterSkillLevels> {
  if (!isNonNullObject(value)) return false;
  return Object.values(value).every(levelMap => {
    if (!isNonNullObject(levelMap)) return false;
    return Object.values(levelMap).every(level =>
      typeof level === 'number' && Number.isInteger(level) && level >= 0 && level <= 10
    );
  });
}

export function isFighterSkillsRecord(value: unknown): value is Record<string, FighterSkills> {
  if (!isNonNullObject(value)) return false;
  return Object.values(value).every(skillMap => {
    if (!isNonNullObject(skillMap)) return false;
    return Object.values(skillMap).every(flag => typeof flag === 'boolean');
  });
}

export function parseFighters(value: unknown, fallback: Fighter[] = []): Fighter[] {
  if (isFightersArray(value)) return value;
  warn('Invalid fighters payload encountered, falling back to default.');
  return fallback;
}

export function parseTasksV2(value: unknown, fallback: TaskV2[] = []): TaskV2[] {
  if (isTasksV2Array(value)) return value;
  warn('Invalid tasks payload encountered, falling back to default.');
  return fallback;
}

export function parseSkillTree(value: unknown, fallback: SkillTree): SkillTree {
  if (isSkillTree(value)) return value;
  warn('Invalid skill tree payload encountered, falling back to default.');
  return fallback;
}

export function parseFighterXpLedger(value: unknown, fallback: Record<string, FighterXpLedger> = {}): Record<string, FighterXpLedger> {
  if (isFighterXpLedgerRecord(value)) return value;
  warn('Invalid XP ledger payload encountered, falling back to default.');
  return fallback;
}

export function parseFighterSkillLevels(value: unknown, fallback: Record<string, FighterSkillLevels> = {}): Record<string, FighterSkillLevels> {
  if (isFighterSkillLevelsRecord(value)) return value;
  warn('Invalid fighter skill levels payload encountered, falling back to default.');
  return fallback;
}

export function parseFighterSkills(value: unknown, fallback: Record<string, FighterSkills> = {}): Record<string, FighterSkills> {
  if (isFighterSkillsRecord(value)) return value;
  warn('Invalid fighter skills payload encountered, falling back to default.');
  return fallback;
}

export const storageValidators = {
  isFighter,
  isFightersArray,
  isTaskV2,
  isTasksV2Array,
  isSkillTree,
  isFighterXpLedgerRecord,
  isFighterSkillLevelsRecord,
  isFighterSkillsRecord
};
