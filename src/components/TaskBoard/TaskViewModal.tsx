import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Fighter, TaskV2, TaskV2Status } from '@/types';
import { Modal } from '@/components/Modal';
import {
  TaskViewModalHeader,
  TaskViewModalFooter,
  TaskDetailsSection,
  TaskHistorySection,
  TaskCommentSection
} from '@/components/TaskBoard/TaskViewModalSections';
import { buildTaskActivityEntries } from '@/components/TaskBoard/taskActivity';

export type TaskViewModalProps = {
  task: TaskV2 | null;
  fighters: Fighter[];
  tasks: TaskV2[];
  skillIndex: Map<string, { name: string; categoryId: string }>;
  approved: Record<string, Record<string, number>>;
  setApproved: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  commentDraft: string;
  setCommentDraft: React.Dispatch<React.SetStateAction<string>>;
  titleDraft: string;
  setTitleDraft: React.Dispatch<React.SetStateAction<string>>;
  descriptionDraft: string;
  setDescriptionDraft: React.Dispatch<React.SetStateAction<string>>;
  priorityDraft: boolean;
  setPriorityDraft: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onSaveDetails: (taskId: string, payload: { title: string; description?: string; isPriority: boolean; changeNotes: string[] }) => void;
  onAddComment: (taskId: string, message: string) => void;
  onStatusChange: (task: TaskV2, status: TaskV2Status) => void;
  statusLabels: Record<TaskV2Status, string>;
  formatDateTime: (value?: number) => string;
};

export const TaskViewModal: React.FC<TaskViewModalProps> = ({
  task,
  fighters,
  tasks,
  skillIndex,
  approved,
  setApproved,
  commentDraft,
  setCommentDraft,
  titleDraft,
  setTitleDraft,
  descriptionDraft,
  setDescriptionDraft,
  priorityDraft,
  setPriorityDraft,
  onClose,
  onDelete,
  onSaveDetails,
  onAddComment,
  onStatusChange,
  statusLabels,
  formatDateTime
}) => {
  const [statusDraft, setStatusDraft] = useState<TaskV2Status>('todo');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const statusOptions = useMemo(() => (
    Object.keys(statusLabels)
      .filter(key => key !== 'archived')
      .map(key => key as TaskV2Status)
  ), [statusLabels]);

  useEffect(() => {
    if (!task) return;
    setTitleDraft(task.title);
    setDescriptionDraft(task.description ?? '');
    setPriorityDraft(!!task.isPriority);
    setStatusDraft(task.status);
    setStatusMenuOpen(false);
    const init: Record<string, Record<string, number>> = {};
    for (const assignee of task.assignees) {
      init[assignee.fighterId] = {};
      for (const skill of assignee.skills) {
        init[assignee.fighterId][skill.skillId] = skill.xpApproved ?? skill.xpSuggested;
      }
    }
    setApproved(init);
  }, [task, setTitleDraft, setDescriptionDraft, setPriorityDraft, setApproved]);

  useEffect(() => {
    setCommentDraft('');
  }, [task, setCommentDraft]);

  useEffect(() => {
    if (!statusMenuOpen) return;
    const handler = (event: MouseEvent) => {
      if (!statusMenuRef.current?.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusMenuOpen]);

  const trimmedTitle = titleDraft.trim();
  const trimmedDescription = descriptionDraft.trim();
  const titleError = trimmedTitle.length === 0;

  const detailsDirty = useMemo(() => {
    if (!task) return false;
    return (
      trimmedTitle !== task.title.trim() ||
      trimmedDescription !== (task.description ?? '').trim() ||
      priorityDraft !== !!task.isPriority ||
      statusDraft !== task.status
    );
  }, [task, trimmedTitle, trimmedDescription, priorityDraft, statusDraft]);

  const activityEntries = useMemo(() => buildTaskActivityEntries(task), [task]);

  const handleStatusToggle = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setStatusMenuOpen(prev => !prev);
  }, []);

  const handleStatusSelect = useCallback((nextStatus: TaskV2Status, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setStatusDraft(nextStatus);
    setStatusMenuOpen(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!task || titleError) return;
    const changeNotes: string[] = [];
    if (trimmedTitle !== task.title.trim()) changeNotes.push('назву задачі');
    if (trimmedDescription !== (task.description ?? '').trim()) changeNotes.push('опис задачі');
    if (statusDraft !== task.status) changeNotes.push('статус задачі');
    onSaveDetails(task.id, {
      title: trimmedTitle,
      description: trimmedDescription || undefined,
      isPriority: priorityDraft,
      changeNotes
    });
    if (statusDraft !== task.status) {
      onStatusChange(task, statusDraft);
    }
  }, [task, titleError, trimmedTitle, trimmedDescription, statusDraft, priorityDraft, onSaveDetails, onStatusChange]);

  const handleDelete = useCallback(() => {
    if (!task) return;
    if (!confirm(`Видалити задачу «${task.title}»?`)) return;
    onDelete(task.id);
  }, [task, onDelete]);

  const handleCommentSubmit = useCallback(() => {
    if (!task) return;
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    onAddComment(task.id, trimmed);
    setCommentDraft('');
  }, [task, commentDraft, onAddComment, setCommentDraft]);

  if (!task) return null;

  return (
    <Modal
      open={!!task}
      onClose={onClose}
      title={task ? (
        <TaskViewModalHeader
          task={task}
          statusDraft={statusDraft}
          statusOptions={statusOptions}
          statusLabels={statusLabels}
          statusMenuOpen={statusMenuOpen}
          onToggleMenu={handleStatusToggle}
          onSelectStatus={handleStatusSelect}
          statusMenuRef={statusMenuRef}
        />
      ) : ''}
      width={840}
      footer={task ? (
        <TaskViewModalFooter
          detailsDirty={detailsDirty}
          titleError={titleError}
          deleteLabel={task ? `Видалити задачу «${task.title}»` : 'Видалити задачу'}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : undefined}
    >
      <div className="modal-stack">
        <div className="modal-text-muted">Скоригуйте XP для кожного бійця та скіла. Anti-exploit зменшує рекомендації при повторюваних задачах.</div>

        <TaskDetailsSection
          titleDraft={titleDraft}
          onTitleChange={setTitleDraft}
          titleError={titleError}
          descriptionDraft={descriptionDraft}
          onDescriptionChange={setDescriptionDraft}
          priorityDraft={priorityDraft}
          onPriorityChange={setPriorityDraft}
        />

        {/* XP секція тимчасово прихована за вимогою */}

        <TaskHistorySection
          activityEntries={activityEntries}
          statusLabels={statusLabels}
          formatDateTime={formatDateTime}
        />

        <TaskCommentSection
          commentDraft={commentDraft}
          onCommentChange={setCommentDraft}
          onSubmit={handleCommentSubmit}
        />
      </div>
    </Modal>
  );
};
