import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Fighter, FighterSkillLevels, FighterSkills, FighterXpLedger, SkillTree } from '@/types';
import { safeGetItem, safeSetItem, generateId } from '@/lib/storage';
import { parseFighters, parseFighterSkillLevels, parseFighterSkills, parseFighterXpLedger } from '@/utils/storageAdapters';
import { levelFromXp, xpThresholdForLevel } from '@/utils';
import { UndoManager } from '@/lib/undo';

/**
 * Configuration contract for {@link useFighterState}. Consumers supply the skill tree and integration hooks.
 */
export type UseFighterStateArgs = {
  tree: SkillTree;
  undoManager: UndoManager;
  onRemoveFighterAssignments: (fighterId: string) => void;
};

/**
 * Public API returned from {@link useFighterState} to manage fighters, skills, and XP ledgers.
 */
export type UseFighterState = {
  fighters: Fighter[];
  setFighters: Dispatch<SetStateAction<Fighter[]>>;
  selectedFighterId: string | null;
  setSelectedFighterId: Dispatch<SetStateAction<string | null>>;
  xpLedger: Record<string, FighterXpLedger>;
  setXpLedger: Dispatch<SetStateAction<Record<string, FighterXpLedger>>>;
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  setFighterSkillLevels: Dispatch<SetStateAction<Record<string, FighterSkillLevels>>>;
  fighterSkills: Record<string, FighterSkills>;
  setFighterSkills: Dispatch<SetStateAction<Record<string, FighterSkills>>>;
  addFighter: (name: string, initialLevels?: FighterSkillLevels, meta?: Partial<Fighter>) => void;
  deleteFighter: (fighterId: string) => void;
};

/**
 * Maintains fighter roster, skill leveling, and XP ledgers with persistence and undo integration.
 */
export function useFighterState({ tree, undoManager, onRemoveFighterAssignments }: UseFighterStateArgs): UseFighterState {
  const [fighters, setFighters] = useState<Fighter[]>(() =>
    safeGetItem('skillrpg_fighters', [], data => parseFighters(data, []))
  );
  const [selectedFighterId, setSelectedFighterId] = useState<string | null>(null);
  const [xpLedger, setXpLedger] = useState<Record<string, FighterXpLedger>>(() =>
    safeGetItem('skillrpg_xp', {}, data => parseFighterXpLedger(data, {}))
  );
  const [fighterSkillLevels, setFighterSkillLevels] = useState<Record<string, FighterSkillLevels>>(() =>
    safeGetItem('skillrpg_fighter_skill_levels', {}, data => parseFighterSkillLevels(data, {}))
  );
  const [fighterSkills, setFighterSkills] = useState<Record<string, FighterSkills>>(() =>
    safeGetItem('skillrpg_fighter_skills', {}, data => parseFighterSkills(data, {}))
  );

  const allSkillIds = useMemo(() => {
    const ids = new Set<string>();
    for (const category of tree.categories) {
      for (const skill of category.skills) {
        ids.add(skill.id);
      }
    }
    return Array.from(ids);
  }, [tree]);

  useEffect(() => {
    safeSetItem('skillrpg_fighters', fighters);
  }, [fighters]);

  useEffect(() => {
    safeSetItem('skillrpg_xp', xpLedger);
  }, [xpLedger]);

  useEffect(() => {
    safeSetItem('skillrpg_fighter_skill_levels', fighterSkillLevels);
  }, [fighterSkillLevels]);

  useEffect(() => {
    safeSetItem('skillrpg_fighter_skills', fighterSkills);
  }, [fighterSkills]);

  useEffect(() => {
    if (allSkillIds.length === 0) return;
    setFighterSkillLevels(prev => {
      let changed = false;
      const next: Record<string, FighterSkillLevels> = {};
      for (const [fighterId, levels] of Object.entries(prev)) {
        const updated: FighterSkillLevels = {};
        for (const skillId of allSkillIds) {
          updated[skillId] = (levels?.[skillId] ?? 0) as FighterSkillLevels[string];
        }
        if (!changed) {
          if (Object.keys(updated).length !== Object.keys(levels || {}).length) {
            changed = true;
          } else {
            for (const skillId of Object.keys(updated)) {
              if (updated[skillId] !== levels[skillId]) {
                changed = true;
                break;
              }
            }
          }
        }
        next[fighterId] = updated;
      }
      return changed ? next : prev;
    });
  }, [allSkillIds]);

  useEffect(() => {
    setFighterSkillLevels(prev => {
      let changed = false;
      const next: Record<string, FighterSkillLevels> = { ...prev };
      for (const [fighterId, ledger] of Object.entries(xpLedger)) {
        const currentLevels = prev[fighterId] ?? ({} as FighterSkillLevels);
        const updated: FighterSkillLevels = { ...currentLevels };
        for (const [skillId, xp] of Object.entries(ledger)) {
          const level = levelFromXp(Number(xp) || 0) as FighterSkillLevels[string];
          if (updated[skillId] !== level) {
            updated[skillId] = level;
            changed = true;
          }
        }
        next[fighterId] = updated;
      }
      return changed ? next : prev;
    });
  }, [xpLedger]);

  useEffect(() => {
    setXpLedger(prev => {
      let changed = false;
      const next: Record<string, FighterXpLedger> = { ...prev };
      for (const [fighterId, levels] of Object.entries(fighterSkillLevels)) {
        const ledger = { ...(next[fighterId] ?? {}) } as FighterXpLedger;
        let localChanged = false;
        for (const [skillId, level] of Object.entries(levels)) {
          const levelNum = Number(level) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
          if (levelNum > 0) {
            const minXp = xpThresholdForLevel(levelNum);
            const currentXp = Number(ledger[skillId] ?? 0);
            if (isNaN(currentXp) || currentXp < minXp) {
              ledger[skillId] = minXp;
              localChanged = true;
            }
          }
        }
        if (localChanged && JSON.stringify(ledger) !== JSON.stringify(next[fighterId])) {
          next[fighterId] = ledger;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [fighterSkillLevels]);

  useEffect(() => {
    if (fighters.length === 0) return;
    setFighterSkillLevels(prev => {
      let changed = false;
      const next = { ...prev } as Record<string, FighterSkillLevels>;
      for (const fighter of fighters) {
        if (!next[fighter.id]) {
          next[fighter.id] = {} as FighterSkillLevels;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setXpLedger(prev => {
      let changed = false;
      const next = { ...prev } as Record<string, FighterXpLedger>;
      for (const fighter of fighters) {
        if (!next[fighter.id]) {
          next[fighter.id] = {} as FighterXpLedger;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [fighters]);

  function addFighter(name: string, initialLevels: FighterSkillLevels = {}, meta?: Partial<Fighter>) {
    const id = generateId('fighter');
    const levels: FighterSkillLevels = {};
    const xpBase: FighterXpLedger = {};
    for (const category of tree.categories) {
      for (const skill of category.skills) {
        const level = (initialLevels[skill.id] ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
        levels[skill.id] = level;
        xpBase[skill.id] = xpThresholdForLevel(level);
      }
    }
    setFighters(prev => [...prev, { id, name, ...meta }]);
    setFighterSkillLevels(prev => ({ ...prev, [id]: levels }));
    setXpLedger(prev => ({ ...prev, [id]: xpBase }));
  }

  function deleteFighter(fighterId: string) {
    const fighterData = fighters.find(f => f.id === fighterId);
    const fighterLevels = fighterSkillLevels[fighterId];
    const fighterXp = xpLedger[fighterId];
    const fighterSkillMap = fighterSkills[fighterId];

    setFighters(prev => prev.filter(f => f.id !== fighterId));
    setFighterSkillLevels(prev => {
      const next = { ...prev } as Record<string, FighterSkillLevels>;
      delete next[fighterId];
      return next;
    });
    setFighterSkills(prev => {
      const next = { ...prev } as Record<string, FighterSkills>;
      delete next[fighterId];
      return next;
    });
    setXpLedger(prev => {
      const next = { ...prev } as Record<string, FighterXpLedger>;
      delete next[fighterId];
      return next;
    });

    onRemoveFighterAssignments(fighterId);

    if (fighterData) {
      undoManager.push({
        id: generateId('undo'),
        type: 'delete_fighter',
        description: `Видалено бійця "${fighterData.callsign || fighterData.name}"`,
        data: { fighter: fighterData, levels: fighterLevels, xp: fighterXp, skills: fighterSkillMap },
        timestamp: Date.now()
      });
    }
  }

  return {
    fighters,
    setFighters,
    selectedFighterId,
    setSelectedFighterId,
    xpLedger,
    setXpLedger,
    fighterSkillLevels,
    setFighterSkillLevels,
    fighterSkills,
    setFighterSkills,
    addFighter,
    deleteFighter
  };
}
