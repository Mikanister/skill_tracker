import React, { useEffect, useMemo, useState } from 'react';
import {
  Category,
  Fighter,
  FighterSkillLevels,
  TaskV2,
  TaskV2Assignee,
  TaskV2Status
} from '@/types';
import { EmptyState } from '@/components/EmptyState';
import MultiAssignTaskModal from '@/components/MultiAssignTaskModal';
import { useTaskBoard } from '@/hooks/useTaskBoard';
import { TaskColumn } from '@/components/TaskBoard/TaskColumn';
import { TaskCard } from '@/components/TaskBoard/TaskCard';
import { TaskViewModal } from '@/components/TaskBoard/TaskViewModal';

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
  const [approvalComment, setApprovalComment] = useState('');
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
      setApprovalComment('');
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
    setApprovalComment('');
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
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Пошук задачі за назвою або номером"
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-panel)',
            color: 'var(--fg)',
            fontSize: 14,
            boxShadow: 'var(--shadow-sm)'
          }}
        />
        {(searchFocused || searchQuery.trim()) && searchSuggestions.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              margin: 0,
              padding: 8,
              listStyle: 'none',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-md)',
              display: 'grid',
              gap: 6,
              zIndex: 20,
              maxHeight: 260,
              overflow: 'auto'
            }}
          >
            {searchSuggestions.map(suggestion => (
              <li
                key={suggestion.id}
                data-testid={`task-suggestion-${suggestion.id}`}
                onMouseDown={event => {
                  event.preventDefault();
                  handleSuggestionSelect(suggestion.id);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  background: 'var(--surface-panel)'
                }}
              >
                <span style={{ display: 'grid' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>#{suggestion.taskNumber ?? '—'}</span>
                  <span style={{ fontWeight: 600 }}>{suggestion.title}</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{STATUS_LABELS[suggestion.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <header style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 32 }}>Дошка задач</h2>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{activeCount} активних задач</div>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Фільтр за виконавцем</span>
          <select
            value={assigneeFilter}
            onChange={event => setAssigneeFilter(event.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
          >
            <option value="all">Усі виконавці</option>
            {fighters.map(fighter => (
              <option key={fighter.id} value={fighter.id}>{fighter.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{ padding: '12px 18px', borderRadius: 14, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, letterSpacing: '0.02em', boxShadow: 'var(--shadow-sm)' }}
        >
          + Створити задачу
        </button>
      </header>

      {noTasks ? (
        <div style={{ flex: 1, borderRadius: 18, border: '1px dashed var(--border-subtle)', background: 'var(--surface-glass-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
          <EmptyState
            icon="🗂️"
            title="Поки що немає задач"
            description="Створіть першу задачу, щоб відстежувати прогрес бійців."
            action={{ label: '+ Створити задачу', onClick: () => setCreateOpen(true) }}
          />
        </div>
      ) : noFilteredMatches ? (
        <div style={{ flex: 1, borderRadius: 18, border: '1px dashed var(--border-subtle)', background: 'var(--surface-glass-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
          <EmptyState
            icon="🕵️"
            title="Немає задач за вибраним виконавцем"
            description="Спробуйте вибрати іншого бійця або скинути фільтр."
            action={assigneeFilter !== 'all' ? { label: 'Скинути фільтр', onClick: () => setAssigneeFilter('all') } : undefined}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))', gap: 18, minHeight: 0, flex: 1 }}>
          {BOARD_COLUMNS.map(([status, label]) => (
            <TaskColumn
              key={status}
              status={status}
              title={label}
              tasks={byStatus[status]}
              expanded={expandedColumns[status]}
              visibleLimit={COLUMN_VISIBLE_LIMIT}
              isDropTarget={dropTargetStatus === status}
              onToggleExpand={toggleColumnExpansion}
              onDragEnter={setDropTargetStatus}
              onDragLeave={() => setDropTargetStatus(null)}
              onDrop={handleColumnDrop}
              renderTask={renderTask}
            />
          ))}
        </div>
      )}

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
