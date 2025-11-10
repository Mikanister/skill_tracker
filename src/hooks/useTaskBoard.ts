import { useMemo, useState } from 'react';
import { TaskV2, TaskV2Status } from '@/types';

type UseTaskBoardParams = {
  tasks: TaskV2[];
  onStatusChange: (taskId: string, status: TaskV2Status) => void;
};

type BoardColumnsState = Record<TaskV2Status, boolean>;

const DEFAULT_EXPANSION: BoardColumnsState = {
  todo: false,
  in_progress: false,
  validation: false,
  done: false,
  archived: false
};

export function useTaskBoard({ tasks, onStatusChange }: UseTaskBoardParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [expandedColumns, setExpandedColumns] = useState<BoardColumnsState>({ ...DEFAULT_EXPANSION });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<TaskV2Status | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTaskData, setSelectedTaskData] = useState<TaskV2 | null>(null);

  const filteredTasks = useMemo(() => {
    if (assigneeFilter === 'all') return tasks;
    return tasks.filter(task => task.assignees.some(a => a.fighterId === assigneeFilter));
  }, [tasks, assigneeFilter]);

  const byStatus = useMemo(() => ({
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    validation: filteredTasks.filter(t => t.status === 'validation'),
    done: filteredTasks.filter(t => t.status === 'done'),
    archived: filteredTasks
      .filter(t => t.status === 'archived')
      .sort((a, b) => (b.approvedAt || b.createdAt || 0) - (a.approvedAt || a.createdAt || 0))
  }), [filteredTasks]);

  const searchSuggestions = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return [] as TaskV2[];
    const numeric = Number(term.replace(/^#/, ''));
    return tasks
      .filter(task => {
        const titleMatch = (task.title ?? '').toLowerCase().includes(term);
        const numberMatch = Number.isFinite(numeric) && (task.taskNumber ?? -1) === numeric;
        return titleMatch || numberMatch;
      })
      .slice(0, 8);
  }, [tasks, searchQuery]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return selectedTaskData;
    return tasks.find(task => task.id === selectedTaskId) ?? selectedTaskData;
  }, [tasks, selectedTaskId, selectedTaskData]);

  const toggleColumnExpansion = (status: TaskV2Status) => {
    setExpandedColumns(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const openTask = (task: TaskV2) => {
    setSelectedTaskId(task.id);
    setSelectedTaskData(task);
    setTaskModalOpen(true);
  };

  const openTaskById = (taskId: string, options?: { task?: TaskV2 | null }) => {
    setSelectedTaskId(taskId);
    setSelectedTaskData(options?.task ?? null);
    setTaskModalOpen(true);
  };

  const closeTask = () => {
    setTaskModalOpen(false);
    setSelectedTaskId(null);
    setSelectedTaskData(null);
  };

  const resetDragState = () => {
    setDraggedTaskId(null);
    setDropTargetStatus(null);
  };

  const handleDrop = (
    targetStatus: TaskV2Status,
    options?: { onApproval?: (task: TaskV2) => void }
  ) => {
    if (!draggedTaskId) return;
    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task) {
      resetDragState();
      return;
    }

    if (targetStatus === 'done') {
      if (task.status !== 'validation') {
        onStatusChange(task.id, 'validation');
      }
      options?.onApproval?.({ ...task, status: 'validation' });
    } else if (task.status !== targetStatus) {
      onStatusChange(task.id, targetStatus);
    }

    resetDragState();
  };

  return {
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
    isTaskModalOpen,
    setTaskModalOpen,
    selectedTaskId,
    selectedTaskData,
    setSelectedTaskData
  };
}
