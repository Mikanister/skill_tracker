import {
  SkillTree,
  Fighter,
  FighterSkillLevels,
  FighterXpLedger,
  TaskV2,
  Category,
  Skill,
  Level,
  Task,
  TaskV2Assignee,
  TaskV2AssigneeSkill
} from '../types';

export type ExportPayload = {
  tree: SkillTree;
  fighters: Fighter[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  xpLedger: Record<string, FighterXpLedger>;
  tasksV2: TaskV2[];
};

export type ExportData = ExportPayload & {
  version: number;
  exportedAt: number;
};

type CsvExportOptions = {
  delimiter?: string;
  locale?: string;
};

const isNonNullObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isTask = (value: unknown): value is Task => {
  if (!isNonNullObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.done === 'boolean' &&
    (value.description === undefined || typeof value.description === 'string') &&
    (value.difficulty === undefined || typeof value.difficulty === 'number')
  );
};

const isLevel = (value: unknown): value is Level => {
  if (!isNonNullObject(value)) return false;
  return (
    typeof value.level === 'number' &&
    typeof value.title === 'string' &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask)
  );
};

const isSkill = (value: unknown): value is Skill => {
  if (!isNonNullObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.levels) &&
    value.levels.every(isLevel)
  );
};

const isCategory = (value: unknown): value is Category => {
  if (!isNonNullObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.skills) &&
    value.skills.every(isSkill)
  );
};

const isSkillTree = (value: unknown): value is SkillTree => {
  if (!isNonNullObject(value)) return false;
  return Array.isArray(value.categories) && value.categories.every(isCategory);
};

const isFighter = (value: unknown): value is Fighter => {
  if (!isNonNullObject(value)) return false;
  return typeof value.id === 'string' && typeof value.name === 'string';
};

const isFighterSkillLevelsRecord = (value: unknown): value is Record<string, FighterSkillLevels> => {
  if (!isNonNullObject(value)) return false;
  return Object.values(value).every(levels => {
    if (!isNonNullObject(levels)) return false;
    return Object.values(levels).every(entry => typeof entry === 'number');
  });
};

const isFighterXpLedgerRecord = (value: unknown): value is Record<string, FighterXpLedger> => {
  if (!isNonNullObject(value)) return false;
  return Object.values(value).every(ledger => {
    if (!isNonNullObject(ledger)) return false;
    return Object.values(ledger).every(entry => typeof entry === 'number');
  });
};

const isTaskV2AssigneeSkill = (value: unknown): value is TaskV2AssigneeSkill => {
  if (!isNonNullObject(value)) return false;
  return (
    typeof value.skillId === 'string' &&
    typeof value.categoryId === 'string' &&
    typeof value.xpSuggested === 'number' &&
    (value.xpApproved === undefined || typeof value.xpApproved === 'number')
  );
};

const isTaskV2Assignee = (value: unknown): value is TaskV2Assignee => {
  if (!isNonNullObject(value)) return false;
  return (
    typeof value.fighterId === 'string' &&
    Array.isArray(value.skills) &&
    value.skills.every(isTaskV2AssigneeSkill)
  );
};

const isTaskV2 = (value: unknown): value is TaskV2 => {
  if (!isNonNullObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.difficulty === 'number' &&
    typeof value.status === 'string' &&
    typeof value.createdAt === 'number' &&
    Array.isArray(value.assignees) &&
    value.assignees.every(isTaskV2Assignee)
  );
};

const isExportData = (value: unknown): value is ExportData => {
  if (!isNonNullObject(value)) return false;
  return (
    typeof value.version === 'number' &&
    typeof value.exportedAt === 'number' &&
    isSkillTree(value.tree) &&
    Array.isArray(value.fighters) && value.fighters.every(isFighter) &&
    isFighterSkillLevelsRecord(value.fighterSkillLevels) &&
    isFighterXpLedgerRecord(value.xpLedger) &&
    Array.isArray(value.tasksV2) && value.tasksV2.every(isTaskV2)
  );
};

const escapeCsvCell = (value: string, delimiter: string): string => {
  const sanitized = value.replace(/"/g, '""');
  const shouldWrap =
    sanitized.includes('"') ||
    sanitized.includes('\n') ||
    sanitized.includes(delimiter) ||
    sanitized.startsWith(' ') ||
    sanitized.endsWith(' ');
  return shouldWrap ? `"${sanitized}"` : sanitized;
};

const formatNumber = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value);

export function exportToJSON(data: ExportPayload): string {
  const exportData: ExportData = {
    version: 1,
    exportedAt: Date.now(),
    ...data
  };
  return JSON.stringify(exportData, null, 2);
}

export function downloadJSON(data: ExportPayload, filename: string = 'skillrpg-export.json') {
  const json = exportToJSON(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(jsonString: string): ExportData | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!isExportData(parsed)) {
      console.error('Invalid export payload shape.');
      return null;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to import JSON:', error);
    return null;
  }
}

export function exportToCSV(
  fighters: readonly Fighter[],
  xpLedger: Readonly<Record<string, FighterXpLedger>>,
  categories: readonly Category[],
  options: CsvExportOptions = {}
): string {
  const { delimiter = ',', locale = 'uk-UA' } = options;
  const allSkills = categories.flatMap(cat =>
    cat.skills.map(skill => ({ id: skill.id, name: skill.name, category: cat.name }))
  );

  const headerCells = ['Name', 'Callsign', 'Rank', 'Unit'];

  const header = headerCells
    .concat(allSkills.map(skill => `${skill.category}: ${skill.name}`))
    .map(value => escapeCsvCell(value, delimiter))
    .join(delimiter);

  const rows = fighters.map(fighter => {
    const baseCells = [
      fighter.fullName || fighter.name || '',
      fighter.callsign || '',
      fighter.rank || '',
      fighter.unit || ''
    ];
    const xpCells = allSkills.map(skill => {
      const xp = xpLedger[fighter.id]?.[skill.id] ?? 0;
      return formatNumber(xp, locale);
    });
    return baseCells
      .concat(xpCells)
      .map(value => escapeCsvCell(String(value), delimiter))
      .join(delimiter);
  });

  return [header, ...rows].join('\n');
}

export function downloadCSV(
  fighters: readonly Fighter[],
  xpLedger: Readonly<Record<string, FighterXpLedger>>,
  categories: readonly Category[],
  filename: string = 'skillrpg-export.csv',
  options: CsvExportOptions = {}
) {
  const csv = exportToCSV(fighters, xpLedger, categories, options);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
