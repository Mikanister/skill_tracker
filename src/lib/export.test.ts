import { describe, it, expect, vi, afterEach } from 'vitest';
import { exportToJSON, importFromJSON, exportToCSV, downloadJSON, downloadCSV, type ExportPayload } from './export';
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

  it('accepts complex payloads with categories, fighters, and tasks', () => {
    const payload: ExportPayload = {
      tree: {
        version: 2,
        categories: [
          {
            id: 'cat1',
            name: 'Розвідка',
            skills: [
              {
                id: 'skill1',
                name: 'Нічний патруль',
                levels: [
                  {
                    level: 1,
                    title: 'Базовий',
                    tasks: [
                      {
                        id: 'task-1',
                        text: 'Розвідати сектор',
                        done: true,
                        description: 'Виконати огляд території вночі',
                        difficulty: 2
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      fighters: [
        {
          id: 'f1',
          name: 'Alpha',
          fullName: 'Alpha One',
          unit: '1 ОМБр'
        }
      ],
      fighterSkillLevels: {
        f1: {
          skill1: 3
        }
      },
      xpLedger: {
        f1: {
          skill1: 120
        }
      },
      tasksV2: [
        {
          id: 't1',
          title: 'Нічний патруль',
          description: 'Перевірити периметр',
          difficulty: 3,
          status: 'validation',
          createdAt: 1_700_000_000_000,
          submittedAt: 1_700_000_100_000,
          assignees: [
            {
              fighterId: 'f1',
              skills: [
                {
                  skillId: 'skill1',
                  categoryId: 'cat1',
                  xpSuggested: 12,
                  xpApproved: 10
                }
              ]
            }
          ]
        }
      ]
    };

    const json = exportToJSON(payload);
    const data = importFromJSON(json);

    expect(data).not.toBeNull();
    expect(data?.tree).toEqual(payload.tree);
    expect(data?.fighters).toEqual(payload.fighters);
    expect(data?.fighterSkillLevels).toEqual(payload.fighterSkillLevels);
    expect(data?.xpLedger).toEqual(payload.xpLedger);
    expect(data?.tasksV2).toEqual(payload.tasksV2);
  });

  it('rejects malformed JSON exports', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(importFromJSON('{"version":1}')).toBeNull();
    expect(importFromJSON('not-json')).toBeNull();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('logs error when payload shape is incorrect', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const invalidPayload = JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      tree: {},
      fighters: [],
      fighterSkillLevels: {},
      xpLedger: {},
      tasksV2: []
    });

    expect(importFromJSON(invalidPayload)).toBeNull();
    expect(consoleError).toHaveBeenCalledWith('Invalid export payload shape.');
    consoleError.mockRestore();
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

  it('wraps CSV cells when delimiter appears and preserves trailing spaces', () => {
    const fighters: Fighter[] = [{ id: 'f1', name: 'Scout ' }];
    const xpLedger: Record<string, FighterXpLedger> = { f1: { skill1: 0 } };
    const categories: Category[] = [
      {
        id: 'cat1',
        name: 'Recon, ops',
        skills: [{ id: 'skill1', name: 'Area, sweep', levels: [{ level: 1, title: 'L1', tasks: [] }] }]
      }
    ];

    const csv = exportToCSV(fighters, xpLedger, categories, { delimiter: ',', locale: 'uk-UA' });
    const [header, row] = csv.split('\n');

    expect(header).toBe('Name,Callsign,Rank,Unit,"Recon, ops: Area, sweep"');
    expect(row).toBe('"Scout ",,,,0');
  });

  describe('download helpers', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('creates downloadable JSON blob', async () => {
      const realCreateElement = document.createElement.bind(document);
      const link = realCreateElement('a');
      const clickSpy = vi.spyOn(link, 'click');

      vi.spyOn(document, 'createElement').mockImplementation(tagName => (tagName === 'a' ? link : realCreateElement(tagName)));
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:json');
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      downloadJSON(emptyPayload, 'backup.json');

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('application/json');
      expect(blobArg.size).toBeGreaterThan(0);

      expect(link.href).toBe('blob:json');
      expect(link.download).toBe('backup.json');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeSpy).toHaveBeenCalledWith('blob:json');
    });

    it('creates downloadable CSV blob', async () => {
      const realCreateElement = document.createElement.bind(document);
      const link = realCreateElement('a');
      const clickSpy = vi.spyOn(link, 'click');

      vi.spyOn(document, 'createElement').mockImplementation(tagName => (tagName === 'a' ? link : realCreateElement(tagName)));
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv');
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const fighters: Fighter[] = [{ id: 'f1', name: 'Alpha' }];
      const ledger: Record<string, FighterXpLedger> = { f1: { skill1: 12 } };
      const categories: Category[] = [
        {
          id: 'cat1',
          name: 'Category',
          skills: [{ id: 'skill1', name: 'Skill', levels: [{ level: 1, title: 'L1', tasks: [] }] }]
        }
      ];

      downloadCSV(fighters, ledger, categories, 'skills.csv');

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('text/csv;charset=utf-8;');
      expect(blobArg.size).toBeGreaterThan(0);

      expect(link.href).toBe('blob:csv');
      expect(link.download).toBe('skills.csv');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeSpy).toHaveBeenCalledWith('blob:csv');
    });
  });
});
