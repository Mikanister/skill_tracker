import { STORAGE_KEY, SkillTree } from './types';
import { SEED } from './seed';

const PROFILE_LIST_KEY = 'skillrpg_profiles';
const ACTIVE_PROFILE_KEY = 'skillrpg_profile';

export function getActiveProfile(): string {
  const p = localStorage.getItem(ACTIVE_PROFILE_KEY);
  return p || 'default';
}

export function setActiveProfile(profile: string) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, profile);
}

export function listProfiles(): string[] {
  try {
    const raw = localStorage.getItem(PROFILE_LIST_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return arr.length ? arr : ['default'];
  } catch {
    return ['default'];
  }
}

export function ensureProfileExists(profile: string) {
  const list = new Set(listProfiles());
  if (!list.has(profile)) {
    list.add(profile);
    localStorage.setItem(PROFILE_LIST_KEY, JSON.stringify(Array.from(list)));
  }
}

function keyFor(profile: string) {
  return profile === 'default' ? STORAGE_KEY : `${STORAGE_KEY}__${profile}`;
}

export function loadSkillTree(profile = getActiveProfile()): SkillTree {
  ensureProfileExists(profile);
  try {
    const raw = localStorage.getItem(keyFor(profile));
    if (!raw) return structuredClone(SEED);
    const parsed = JSON.parse(raw) as SkillTree;
    // Використовуємо існуючі дані як є; не скидаємо за версією
    return parsed ?? structuredClone(SEED);
  } catch {
    return structuredClone(SEED);
  }
}

export function saveSkillTree(tree: SkillTree, profile = getActiveProfile()): void {
  ensureProfileExists(profile);
  localStorage.setItem(keyFor(profile), JSON.stringify(tree));
}

export function resetToSeed(profile = getActiveProfile()): SkillTree {
  const cloned = structuredClone(SEED);
  localStorage.setItem(keyFor(profile), JSON.stringify(cloned));
  return cloned;
}

