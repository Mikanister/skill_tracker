import React from 'react';
import { Modal } from '@/components/Modal';
import { ModalActions } from '@/components/ModalActions';
import { Category, Fighter, FighterSkillLevels, TaskV2, TaskV2Assignee } from '@/types';
import { useMultiAssignForm } from '@/hooks/useMultiAssignForm';
import { FormControls } from './FormControls';
import { AssigneeSelector } from './AssigneeSelector';
import { AssigneeSkills, SkillBoard } from './SkillBoard';

type MultiAssignTaskPayload = {
  title: string;
  description?: string;
  difficulty: 1|2|3|4|5;
  assignees: TaskV2Assignee[];
  isPriority?: boolean;
};

export type MultiAssignTaskModalProps = {
  open: boolean;
  onClose: () => void;
  fighters: Fighter[];
  categories: Category[];
  tasks?: TaskV2[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  onCreate: (payload: MultiAssignTaskPayload) => void;
};

const DEFAULT_DIFFICULTY: 1|2|3|4|5 = 3;

const hasTitle = (value: string) => value.trim().length > 0;

const mapSelectedFighters = (fighters: Fighter[], selected: Record<string, boolean>) =>
  fighters.filter(fighter => selected[fighter.id]);

export default function MultiAssignTaskModal({ open, onClose, fighters, categories, tasks = [], fighterSkillLevels, onCreate }: MultiAssignTaskModalProps) {
  const {
    title,
    description,
    difficulty,
    isPriority,
    search,
    error,
    selectedFighters,
    assigneeSkills,
    filteredFighters,
    selectedFighterList,
    setTitle,
    setDescription,
    setDifficulty,
    setIsPriority,
    setSearch,
    toggleFighter,
    toggleSkill,
    setSkillXp,
    submit,
    reset,
    clearError
  } = useMultiAssignForm({
    fighters,
    categories,
    tasks,
    fighterSkillLevels,
    defaultDifficulty: DEFAULT_DIFFICULTY
  });

  const handleClose = () => {
    clearError();
    onClose();
  };

  const handleSubmit = () => {
    const payload = submit();
    if (!payload) return;
    onCreate(payload);
    reset();
    onClose();
  };

  const disableSubmit = !hasTitle(title);
  const allFightersCount = fighters.length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Нова задача (кілька виконавців)"
      width={820}
      footer={(
        <ModalActions
          actions={[
            { label: 'Скасувати', onClick: handleClose, variant: 'panel' },
            { label: 'Створити задачу', onClick: handleSubmit, variant: 'success-soft', disabled: disableSubmit }
          ]}
        />
      )}
    >
      <div className="multiassign-grid">
        <FormControls
          title={title}
          difficulty={difficulty}
          isPriority={isPriority}
          description={description}
          error={error}
          onTitleChange={value => {
            setTitle(value);
            if (error) clearError();
          }}
          onDifficultyChange={setDifficulty}
          onPriorityChange={setIsPriority}
          onDescriptionChange={setDescription}
        />

        <AssigneeSelector
          search={search}
          onSearchChange={setSearch}
          filteredFighters={filteredFighters}
          selectedFighters={selectedFighters}
          onToggleFighter={toggleFighter}
        />

        <SkillBoard
          categories={categories}
          selectedFighters={mapSelectedFighters(fighters, selectedFighters)}
          assigneeSkills={assigneeSkills as AssigneeSkills}
          fighterSkillLevels={fighterSkillLevels}
          tasks={tasks}
          difficulty={difficulty}
          title={title}
          onToggleSkill={toggleSkill}
          onSetSkillXp={setSkillXp}
          allFightersCount={allFightersCount}
        />
      </div>
    </Modal>
  );
}
