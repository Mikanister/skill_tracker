import React, { useEffect, useMemo, useState } from 'react';
import {
  Category,
  Fighter,
  FighterSkillLevels,
  TaskV2,
  TaskV2Assignee,
  TaskV2Status
} from '@/types';
import { useTaskBoard } from '@/hooks/useTaskBoard';
import { TaskCard } from '@/components/TaskBoard/TaskCard';
import { TaskViewModal } from '@/components/TaskBoard/TaskViewModal';
import MultiAssignTaskModal from '@/components/MultiAssignTaskModal';
import { SearchBar } from './components/SearchBar';
import { HomeHeader } from './components/HomeHeader';
import { TaskBoardSection } from './components/TaskBoardSection';

const BOARD_COLUMNS: [TaskV2Status, string][] = [
  ['todo', 'To Do'],
  ['in_progress', 'In Progress'],
  ['validation', 'Validation'],
  ['done', 'Done']
];

const COLUMN_VISIBLE_LIMIT = 25;

const STATUS_LABELS: Record<TaskV2Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  validation: 'Validation',
  done: 'Done',
  archived: 'Archived'
};

type Props = {
  fighters: Fighter[];
  categories: Category[];
  tasks: TaskV2[];
  createTask: (payload: { title: string; description?: string; difficulty: 1 | 2 | 3 | 4 | 5; assignees: TaskV2Assignee[]; isPriority?: boolean }) => void;
  updateStatus: (taskId: string, status: TaskV2Status) => void;
  updateDetails: (taskId: string, updates: { title?: string; description?: string; isPriority?: boolean }) => void;
  approveTask: (taskId: string, approved: Record<string, Record<string, number>>) => void;
  deleteTask: (taskId: string) => void;
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  addComment: (taskId: string, message: string, author?: string) => void;
};

export default function Home({ fighters, categories, tasks, createTask, updateStatus, updateDetails, approveTask, deleteTask, fighterSkillLevels, addComment }: Props) {
  const {
    searchQuery,
    setSearchQuery,
    searchFocused,
    setSearchFocused,
    searchSuggestions,
    assigneeFilter,
    setAssigneeFilter,
    expandedColumns,
    toggleColumnExpansion,
    draggedTaskId,
    setDraggedTaskId,
    dropTargetStatus,
    setDropTargetStatus,
    handleDrop,
    resetDragState,
    filteredTasks,
    byStatus,
    openTask,
    openTaskById,
    closeTask,
    selectedTask,
    isTaskModalOpen
  } = useTaskBoard({ tasks, onStatusChange: updateStatus });

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [approved, setApproved] = useState<Record<string, Record<string, number>>>({});
  const [commentDraft, setCommentDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [priorityDraft, setPriorityDraft] = useState(false);

  const skillIndex = useMemo(() => {
    const map = new Map<string, { name: string; categoryId: string }>();
    for (const category of categories) {
      for (const skill of category.skills) {
        map.set(skill.id, { name: skill.name, categoryId: category.id });
      }
    }
    return map;
  }, [categories]);

  const fightersMap = useMemo(() => {
    const map = new Map<string, Fighter>();
    for (const fighter of fighters) {
      map.set(fighter.id, fighter);
    }
    return map;
  }, [fighters]);

  useEffect(() => {
    if (!selectedTask) {
      setTitleDraft('');
      setDescriptionDraft('');
      setPriorityDraft(false);
      setApproved({});
      setCommentDraft('');
      return;
    }

    setTitleDraft(selectedTask.title ?? '');
    setDescriptionDraft(selectedTask.description ?? '');
    setPriorityDraft(!!selectedTask.isPriority);

    const initial: Record<string, Record<string, number>> = {};
    for (const assignee of selectedTask.assignees) {
      initial[assignee.fighterId] = {};
      for (const skill of assignee.skills) {
        initial[assignee.fighterId][skill.skillId] = skill.xpApproved ?? skill.xpSuggested;
      }
    }
    setApproved(initial);
    setCommentDraft('');
  }, [selectedTask]);

  const formatDateTime = (value?: number) => (value ? new Date(value).toLocaleString('uk-UA') : '—');

  const noTasks = tasks.length === 0;
  const noFilteredMatches = !noTasks && filteredTasks.length === 0;
  const activeCount = byStatus.in_progress.length + byStatus.validation.length;

  const handleSuggestionSelect = (taskId: string) => {
    openTaskById(taskId);
    setSearchQuery('');
  };

  const handleStatusChange = (task: TaskV2, next: TaskV2Status) => {
    if (next === task.status) return;

    if (next === 'done') {
      if (task.status !== 'validation') {
        updateStatus(task.id, 'validation');
      }
      openTaskById(task.id);
      return;
    }

    updateStatus(task.id, next);
  };

  const handleColumnDrop = (status: TaskV2Status) => {
    handleDrop(status, { onApproval: openTask });
  };

  const handleCloseModal = () => {
    closeTask();
  };

  const handleSaveDetails = (
    taskId: string,
    { title, description, isPriority, changeNotes }: { title: string; description?: string; isPriority: boolean; changeNotes: string[] }
  ) => {
    updateDetails(taskId, { title, description, isPriority });
    if (changeNotes.length > 0) {
      const message = changeNotes.length === 2 ? 'Оновлено назву та опис задачі' : `Оновлено ${changeNotes[0]}`;
      addComment(taskId, message);
    }
  };

  const handleApproveTask = (taskId: string, approvalMap: Record<string, Record<string, number>>, comment?: string) => {
    approveTask(taskId, approvalMap);
    if (comment?.trim()) {
      addComment(taskId, comment.trim());
    }
    handleCloseModal();
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    handleCloseModal();
  };

  const handleAddComment = (taskId: string, message: string) => {
    addComment(taskId, message);
  };

  const renderTask = (task: TaskV2) => (
    <TaskCard
      key={task.id}
      task={task}
      isDragging={draggedTaskId === task.id}
      onDragStart={() => setDraggedTaskId(task.id)}
      onDragEnd={resetDragState}
      onSelect={() => openTask(task)}
      fightersMap={fightersMap}
      onArchive={(nextTask: TaskV2) => updateStatus(nextTask.id, 'archived')}
      onRestore={(nextTask: TaskV2) => updateStatus(nextTask.id, 'todo')}
      onStatusChange={handleStatusChange}
      formatDateTime={formatDateTime}
    />
  );

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--surface-panel-alt)' }}>
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchFocused={searchFocused}
        onFocusChange={setSearchFocused}
        searchSuggestions={searchSuggestions}
        onSuggestionSelect={handleSuggestionSelect}
        statusLabels={STATUS_LABELS}
      />

      <HomeHeader
        activeCount={activeCount}
        fighters={fighters}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        onOpenCreate={() => setCreateOpen(true)}
      />

      <TaskBoardSection
        boardColumns={BOARD_COLUMNS}
        byStatus={byStatus}
        expandedColumns={expandedColumns}
        dropTargetStatus={dropTargetStatus}
        columnVisibleLimit={COLUMN_VISIBLE_LIMIT}
        noTasks={noTasks}
        noFilteredMatches={noFilteredMatches}
        assigneeFilter={assigneeFilter}
        onResetFilter={() => setAssigneeFilter('all')}
        onOpenCreate={() => setCreateOpen(true)}
        onToggleExpand={toggleColumnExpansion}
        onDragEnter={setDropTargetStatus}
        onDragLeave={() => setDropTargetStatus(null)}
        onDrop={handleColumnDrop}
        renderTask={renderTask}
      />

      <TaskViewModal
        task={isTaskModalOpen ? selectedTask ?? null : null}
        fighters={fighters}
        tasks={tasks}
        skillIndex={skillIndex}
        approved={approved}
        setApproved={setApproved}
        commentDraft={commentDraft}
        setCommentDraft={setCommentDraft}
        titleDraft={titleDraft}
        setTitleDraft={setTitleDraft}
        descriptionDraft={descriptionDraft}
        setDescriptionDraft={setDescriptionDraft}
        priorityDraft={priorityDraft}
        setPriorityDraft={setPriorityDraft}
        onClose={handleCloseModal}
        onDelete={handleDeleteTask}
        onSaveDetails={handleSaveDetails}
        onAddComment={handleAddComment}
        onStatusChange={handleStatusChange}
        statusLabels={STATUS_LABELS}
        formatDateTime={formatDateTime}
      />

      <MultiAssignTaskModal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        fighters={fighters}
        categories={categories}
        tasks={tasks}
        fighterSkillLevels={fighterSkillLevels}
        onCreate={payload => {
          createTask(payload);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
