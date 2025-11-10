import { useEffect, useMemo, useState } from 'react';
import { Category, Skill, SkillTree } from '@/types';
import { loadSkillTree, saveSkillTree, resetToSeed, getActiveProfile, setActiveProfile, listProfiles, ensureProfileExists } from '@/storage';
import { generateId } from '@/lib/storage';
import { UndoManager } from '@/lib/undo';

export type UseSkillTreeStateArgs = {
  undoManager: UndoManager;
};

export type UseSkillTreeState = {
  tree: SkillTree;
  profile: string;
  profiles: string[];
  selectedCategoryId: string | null;
  setSelectedCategoryId: (categoryId: string | null) => void;
  selectedSkillId: string | null;
  setSelectedSkillId: (skillId: string | null) => void;
  selectedCategory: Category | undefined;
  selectedSkill: Skill | undefined;
  addSkill: (categoryId: string, name: string) => void;
  updateSkill: (skill: Skill) => void;
  deleteSkill: (skillId: string) => void;
  addCategory: (name: string) => void;
  renameCategory: (categoryId: string, newName: string) => void;
  deleteCategory: (categoryId: string) => void;
  moveSkillToCategory: (skillId: string, targetCategoryId: string) => void;
  onResetToSeed: () => void;
  switchProfile: (nextProfile: string) => void;
  restoreSkill: (skill: Skill, categoryId: string) => void;
  restoreCategory: (category: Category) => void;
};

export function useSkillTreeState({ undoManager }: UseSkillTreeStateArgs): UseSkillTreeState {
  const [profile, setProfile] = useState<string>(() => getActiveProfile());
  const [tree, setTree] = useState<SkillTree>(() => loadSkillTree());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => tree.categories[0]?.id ?? null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  useEffect(() => {
    saveSkillTree(tree, profile);
  }, [tree, profile]);

  const selectedCategory = useMemo(
    () => tree.categories.find(category => category.id === selectedCategoryId),
    [tree, selectedCategoryId]
  );

  const selectedSkill = useMemo(() => {
    if (!selectedCategory) return undefined;
    if (!selectedSkillId) return undefined;
    return selectedCategory.skills.find(skill => skill.id === selectedSkillId);
  }, [selectedCategory, selectedSkillId]);

  const profiles = useMemo(() => listProfiles(), [profile]);

  function addSkill(categoryId: string, name: string) {
    setTree(prev => {
      const next = structuredClone(prev);
      const category = next.categories.find(cat => cat.id === categoryId);
      if (!category) return prev;
      const newSkill: Skill = {
        id: generateId('skill'),
        name,
        description: '',
        tags: [],
        isArchived: false,
        updatedAt: Date.now(),
        levels: [1, 2, 3, 4, 5].map(level => ({
          level: level as 1 | 2 | 3 | 4 | 5,
          title: `Рівень ${level}`,
          tasks: []
        }))
      };
      category.skills.push(newSkill);
      return next;
    });
  }

  function updateSkill(updated: Skill) {
    setTree(prev => {
      const next = structuredClone(prev);
      for (const category of next.categories) {
        const index = category.skills.findIndex(skill => skill.id === updated.id);
        if (index >= 0) {
          category.skills[index] = { ...updated, updatedAt: Date.now() };
          break;
        }
      }
      return next;
    });
  }

  function deleteSkill(skillId: string) {
    const skillData = tree.categories.flatMap(category => category.skills).find(skill => skill.id === skillId);
    const categoryId = tree.categories.find(category => category.skills.some(skill => skill.id === skillId))?.id;

    setTree(prev => {
      const next = structuredClone(prev);
      for (const category of next.categories) {
        const before = category.skills.length;
        category.skills = category.skills.filter(skill => skill.id !== skillId);
        if (category.skills.length !== before) break;
      }
      return next;
    });

    if (skillData && categoryId) {
      undoManager.push({
        id: generateId('undo'),
        type: 'delete_skill',
        description: `Видалено навичку "${skillData.name}"`,
        data: { skill: skillData, categoryId },
        timestamp: Date.now()
      });
    }

    if (selectedSkillId === skillId) setSelectedSkillId(null);
  }

  function addCategory(name: string) {
    setTree(prev => {
      const next = structuredClone(prev);
      const newCategory: Category = {
        id: generateId('cat'),
        name,
        skills: []
      };
      next.categories.push(newCategory);
      return next;
    });
  }

  function renameCategory(categoryId: string, newName: string) {
    setTree(prev => {
      const next = structuredClone(prev);
      const category = next.categories.find(cat => cat.id === categoryId);
      if (category) category.name = newName;
      return next;
    });
  }

  function deleteCategory(categoryId: string) {
    const categoryData = tree.categories.find(category => category.id === categoryId);

    setTree(prev => {
      const next = structuredClone(prev);
      next.categories = next.categories.filter(category => category.id !== categoryId);
      return next;
    });

    if (categoryData) {
      undoManager.push({
        id: generateId('undo'),
        type: 'delete_category',
        description: `Видалено категорію "${categoryData.name}" (${categoryData.skills.length} навичок)`,
        data: { category: categoryData },
        timestamp: Date.now()
      });
    }

    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(prev => (prev === categoryId ? tree.categories.find(cat => cat.id !== categoryId)?.id ?? null : prev));
      setSelectedSkillId(null);
    }
  }

  function moveSkillToCategory(skillId: string, targetCategoryId: string) {
    setTree(prev => {
      const next = structuredClone(prev);
      let skill: Skill | null = null;
      for (const category of next.categories) {
        const index = category.skills.findIndex(item => item.id === skillId);
        if (index >= 0) {
          skill = category.skills.splice(index, 1)[0];
          break;
        }
      }
      if (skill) {
        const targetCategory = next.categories.find(category => category.id === targetCategoryId);
        if (targetCategory) targetCategory.skills.push(skill);
      }
      return next;
    });
  }

  function onResetToSeed() {
    const fresh = resetToSeed(profile);
    setTree(fresh);
    setSelectedCategoryId(fresh.categories[0]?.id ?? null);
    setSelectedSkillId(null);
  }

  function switchProfile(nextProfile: string) {
    ensureProfileExists(nextProfile);
    setActiveProfile(nextProfile);
    setProfile(nextProfile);
    const loaded = loadSkillTree(nextProfile);
    setTree(loaded);
    setSelectedCategoryId(loaded.categories[0]?.id ?? null);
    setSelectedSkillId(null);
  }

  function restoreSkill(skill: Skill, categoryId: string) {
    setTree(prev => {
      const next = structuredClone(prev);
      const category = next.categories.find(cat => cat.id === categoryId);
      if (category) {
        const exists = category.skills.some(existing => existing.id === skill.id);
        if (!exists) category.skills.push(skill);
      }
      return next;
    });
  }

  function restoreCategory(category: Category) {
    setTree(prev => {
      const next = structuredClone(prev);
      const exists = next.categories.some(existing => existing.id === category.id);
      if (!exists) next.categories.push(category);
      return next;
    });
  }

  return {
    tree,
    profile,
    profiles,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSkillId,
    setSelectedSkillId,
    selectedCategory,
    selectedSkill,
    addSkill,
    updateSkill,
    deleteSkill,
    addCategory,
    renameCategory,
    deleteCategory,
    moveSkillToCategory,
    onResetToSeed,
    switchProfile,
    restoreSkill,
    restoreCategory
  };
}
