import { SkillTree, Fighter, FighterSkillLevels, FighterXpLedger, TaskV2 } from '../types';

export type ExportData = {
  version: number;
  exportedAt: number;
  tree: SkillTree;
  fighters: Fighter[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  xpLedger: Record<string, FighterXpLedger>;
  tasksV2: TaskV2[];
};

export function exportToJSON(data: Omit<ExportData, 'version' | 'exportedAt'>): string {
  const exportData: ExportData = {
    version: 1,
    exportedAt: Date.now(),
    ...data
  };
  return JSON.stringify(exportData, null, 2);
}

export function downloadJSON(data: Omit<ExportData, 'version' | 'exportedAt'>, filename: string = 'skillrpg-export.json') {
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
    const data = JSON.parse(jsonString);
    if (!data.version || !data.tree || !Array.isArray(data.fighters)) {
      return null;
    }
    return data as ExportData;
  } catch (error) {
    console.error('Failed to import JSON:', error);
    return null;
  }
}

export function exportToCSV(fighters: Fighter[], xpLedger: Record<string, FighterXpLedger>, categories: any[]): string {
  const allSkills = categories.flatMap(c => c.skills.map((s: any) => ({ id: s.id, name: s.name, category: c.name })));
  
  // Header
  let csv = 'Name,Callsign,Rank,Unit';
  allSkills.forEach(skill => {
    csv += `,${skill.category}: ${skill.name}`;
  });
  csv += '\n';
  
  // Rows
  fighters.forEach(fighter => {
    const row = [
      fighter.fullName || '',
      fighter.callsign || '',
      fighter.rank || '',
      fighter.unit || ''
    ];
    
    allSkills.forEach(skill => {
      const xp = xpLedger[fighter.id]?.[skill.id] || 0;
      row.push(String(xp));
    });
    
    csv += row.map(v => `"${v}"`).join(',') + '\n';
  });
  
  return csv;
}

export function downloadCSV(fighters: Fighter[], xpLedger: Record<string, FighterXpLedger>, categories: any[], filename: string = 'skillrpg-export.csv') {
  const csv = exportToCSV(fighters, xpLedger, categories);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
