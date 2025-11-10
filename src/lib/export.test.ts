import { describe, it, expect } from 'vitest';
import { exportToJSON, importFromJSON, exportToCSV, type ExportPayload } from './export';
import type { Category, Fighter, FighterSkillLevels, FighterXpLedger } from '../types';

describe('export/import utilities', () => {
  const emptyPayload: ExportPayload = {
    tree: { categories: [], version: 1 },
    fighters: [],
    fighterSkillLevels: {},
    xpLedger: {},
    tasksV2: []
  };

  it('serialises and validates JSON payloads', () => {
    const json = exportToJSON(emptyPayload);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe(1);
    expect(parsed.tree).toEqual(emptyPayload.tree);

    const rehydrated = importFromJSON(json);
    expect(rehydrated).not.toBeNull();
    expect(rehydrated?.fighters).toEqual([]);
  });

  it('rejects malformed JSON exports', () => {
    expect(importFromJSON('{"version":1}')).toBeNull();
    expect(importFromJSON('not-json')).toBeNull();
  });

  it('formats CSV with escaping and localisation support', () => {
    const fighters: Fighter[] = [
      {
        id: 'f1',
        name: 'Ігор',
        fullName: 'Ігор, "Сокіл"',
        callsign: 'Sokol',
        rank: 'Lt',
        unit: '1 ОМБр'
      },
      {
        id: 'f2',
        name: 'Олег'
      }
    ];

    const xpLedger: Record<string, FighterXpLedger> = {
      f1: { skill1: 10.5 }
    };

    const levels: Category['skills'][number]['levels'] = [
      { level: 1, title: 'Базовий', tasks: [] }
    ];

    const categories: Category[] = [
      {
        id: 'cat1',
        name: 'Альфа',
        skills: [
          { id: 'skill1', name: 'Розвідка, "ніч"', levels }
        ]
      }
    ];

    const csv = exportToCSV(fighters, xpLedger, categories, { delimiter: ';', locale: 'uk-UA' });
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Name;Callsign;Rank;Unit;"Альфа: Розвідка, ""ніч"""');
    expect(lines[1]).toBe('"Ігор, ""Сокіл""";Sokol;Lt;1 ОМБр;10,5');
    expect(lines[2]).toBe('Олег;;;;0');
  });
});
