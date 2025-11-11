import React, { useCallback, useMemo, useState } from 'react';
import { Category, Fighter, FighterSkillLevels, Skill } from '@/types';
import { buildSkillUsage, calculateSkillStats } from '@/utils/skills';
import { useFormState } from '@/hooks/useFormState';
import { useModalState } from '@/hooks/useModalState';
import { CategorySidebar } from './CategorySidebar';
import { SkillsHeader } from './SkillsHeader';
import { SkillGrid } from './SkillGrid';
import { SkillEditModal } from './SkillEditModal';
import { SkillViewModal } from './SkillViewModal';
import { CategoryModal } from './CategoryModal';

type Props = {
  categories: Category[];
  fighters: Fighter[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  addSkill: (categoryId: string, name: string) => void;
  updateSkill: (skill: Skill) => void;
  deleteSkill: (skillId: string) => void;
  addCategory: (name: string) => void;
  renameCategory: (categoryId: string, newName: string) => void;
  deleteCategory: (categoryId: string) => void;
  moveSkillToCategory: (skillId: string, targetCategoryId: string) => void;
};

export default function Skills({
  categories,
  fighters,
  fighterSkillLevels,
  addSkill,
  updateSkill,
  deleteSkill,
  addCategory,
  renameCategory,
  deleteCategory,
  moveSkillToCategory
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [catEditOpen, setCatEditOpen] = useState(false);
  const [catEditName, setCatEditName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [draggedSkillId, setDraggedSkillId] = useState<string | null>(null);
  const [dropTargetCategoryId, setDropTargetCategoryId] = useState<string | null>(null);

  const {
    isOpen: isEditOpen,
    data: editSkill,
    open: openEditModal,
    close: closeEditModal,
    setData: setEditModalData
  } = useModalState<Skill | null>(false, null);

  const {
    isOpen: isViewOpen,
    data: viewSkill,
    open: openViewModal,
    close: closeViewModal,
    setData: setViewModalData
  } = useModalState<Skill | null>(false, null);

  const {
    values: editValues,
    setValues: setEditValues,
    reset: resetEditForm,
    registerField: registerEditField,
    validate: validateEditForm,
    errors: editErrors,
    clearErrors: clearEditErrors
  } = useFormState({ name: '', description: '' }, {
    name: value => (typeof value === 'string' && value.trim().length > 0 ? null : 'Вкажіть назву навички.')
  });

  const {
    values: viewValues,
    setValues: setViewValues,
    reset: resetViewForm,
    registerField: registerViewField,
    validate: validateViewForm,
    errors: viewErrors,
    clearErrors: clearViewErrors
  } = useFormState({ name: '', description: '' }, {
    name: value => (typeof value === 'string' && value.trim().length > 0 ? null : 'Вкажіть назву навички.')
  });

  const selectedCategory = useMemo(
    () => categories.find(category => category.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const filteredSkills = useMemo(() => {
    if (!selectedCategory) return [];
    const term = search.trim().toLowerCase();
    if (!term) return selectedCategory.skills;
    return selectedCategory.skills.filter(skill =>
      skill.name.toLowerCase().includes(term) ||
      skill.description?.toLowerCase().includes(term)
    );
  }, [selectedCategory, search]);

  const skillUsage = useMemo(() => buildSkillUsage(fighters, fighterSkillLevels), [fighters, fighterSkillLevels]);

  const handleOpenEdit = useCallback((skill?: Skill | null) => {
    clearEditErrors();
    if (skill) {
      openEditModal(skill);
      setEditValues({ name: skill.name, description: skill.description || '' });
    } else {
      openEditModal(null);
      resetEditForm({ name: '', description: '' });
    }
  }, [clearEditErrors, openEditModal, setEditValues, resetEditForm]);

  const handleOpenView = useCallback((skill: Skill) => {
    clearViewErrors();
    openViewModal(skill);
    setViewValues({ name: skill.name, description: skill.description || '' });
  }, [clearViewErrors, openViewModal, setViewValues]);

  const handleSaveSkill = useCallback(() => {
    if (!validateEditForm()) return;
    const name = editValues.name.trim();
    if (editSkill) {
      updateSkill({ ...editSkill, name, description: editValues.description.trim() });
    } else if (selectedCategoryId) {
      addSkill(selectedCategoryId, name);
    }
    resetEditForm({ name: '', description: '' });
    setEditModalData(() => null);
    closeEditModal();
  }, [validateEditForm, editValues, editSkill, updateSkill, selectedCategoryId, addSkill, resetEditForm, setEditModalData, closeEditModal]);

  const handleDropSkill = useCallback((targetCategoryId: string) => {
    if (draggedSkillId && draggedSkillId !== targetCategoryId) {
      moveSkillToCategory(draggedSkillId, targetCategoryId);
    }
    setDraggedSkillId(null);
    setDropTargetCategoryId(null);
  }, [draggedSkillId, moveSkillToCategory]);

  const selectedSkillStats = useMemo(
    () => viewSkill ? calculateSkillStats(viewSkill.id, fighters, fighterSkillLevels) : null,
    [viewSkill, fighters, fighterSkillLevels]
  );

  return (
    <div className="skills-layout">
      <CategorySidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        dropTargetCategoryId={dropTargetCategoryId}
        onSelectCategory={categoryId => setSelectedCategoryId(categoryId)}
        onStartEditCategory={category => {
          setEditingCategory(category);
          setCatEditName(category?.name ?? '');
          setCatEditOpen(true);
        }}
        onRequestCreateCategory={() => {
          setEditingCategory(null);
          setCatEditName('');
          setCatEditOpen(true);
        }}
        onDragOverCategory={categoryId => {
          if (draggedSkillId) setDropTargetCategoryId(categoryId);
        }}
        onDragLeaveCategory={() => setDropTargetCategoryId(null)}
        onDropOnCategory={handleDropSkill}
      />

      <section className="skills-content">
        <SkillsHeader
          categoryName={selectedCategory?.name}
          skillCount={filteredSkills.length}
          search={search}
          onSearchChange={setSearch}
          onAddSkill={() => handleOpenEdit(null)}
        />

        <SkillGrid
          skills={filteredSkills}
          skillUsage={skillUsage}
          draggedSkillId={draggedSkillId}
          onDragStart={skillId => setDraggedSkillId(skillId)}
          onDragEnd={() => {
            setDraggedSkillId(null);
            setDropTargetCategoryId(null);
          }}
          onOpenSkill={handleOpenView}
          onAddSkill={() => handleOpenEdit(null)}
        />
      </section>

      <SkillEditModal
        isOpen={isEditOpen}
        editSkill={editSkill ?? null}
        errors={editErrors}
        registerField={registerEditField}
        onClose={() => {
          closeEditModal();
          setEditModalData(() => null);
          clearEditErrors();
        }}
        onSave={handleSaveSkill}
      />

      <SkillViewModal
        isOpen={isViewOpen && !!viewSkill}
        viewSkill={viewSkill ?? null}
        values={viewValues}
        errors={viewErrors}
        registerField={registerViewField}
        stats={selectedSkillStats}
        onClose={() => {
          closeViewModal();
          setViewModalData(() => null);
          clearViewErrors();
        }}
        onDelete={() => {
          if (viewSkill && confirm(`Видалити навичку «${viewSkill.name}»?`)) {
            deleteSkill(viewSkill.id);
            closeViewModal();
            setViewModalData(() => null);
          }
        }}
        onSave={() => {
          if (!viewSkill) return;
          if (!validateViewForm()) return;
          const name = viewValues.name.trim();
          updateSkill({ ...viewSkill, name, description: viewValues.description.trim() });
          closeViewModal();
          setViewModalData(() => null);
        }}
      />

      <CategoryModal
        open={catEditOpen}
        category={editingCategory}
        name={catEditName}
        onNameChange={setCatEditName}
        onClose={() => setCatEditOpen(false)}
        onSave={() => {
          const name = catEditName.trim();
          if (!name) return;
          if (editingCategory) {
            renameCategory(editingCategory.id, name);
          } else {
            addCategory(name);
          }
          setCatEditOpen(false);
        }}
        onDelete={() => {
          if (!editingCategory) return;
          if (confirm(`Видалити категорію «${editingCategory.name}»? Всі навички в ній також будуть видалені.`)) {
            deleteCategory(editingCategory.id);
            setCatEditOpen(false);
          }
        }}
      />
    </div>
  );
}
