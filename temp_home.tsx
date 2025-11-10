import React, { useEffect, useMemo, useState } from 'react';
import { Category, Fighter, FighterSkillLevels, TaskV2, TaskV2Assignee, TaskV2Status, TaskComment, TaskStatusHistoryEntry } from '@/types';
import MultiAssignTaskModal from '@/components/MultiAssignTaskModal';
import { Modal } from '@/components/Modal';
import { repetitionFactorFromTasks } from '@/utils';
import { EmptyState } from '@/components/EmptyState';

const BOARD_COLUMNS: [TaskV2Status, string][] = [
  ['todo', 'To Do'],
  ['in_progress', 'In Progress'],
  ['validation', 'Validation'],
  ['done', 'Done']
];

const COLUMN_VISIBLE_LIMIT = 25;

const DEFAULT_EXPANSION: Record<TaskV2Status, boolean> = {
  todo: false,
  in_progress: false,
  validation: false,
  done: false,
  archived: false
};

type Props = {
  fighters: Fighter[];
  categories: Category[];
  tasks: TaskV2[];
  createTask: (payload: { title: string; description?: string; difficulty: 1|2|3|4|5; assignees: TaskV2Assignee[]; isPriority?: boolean }) => void;
  updateStatus: (taskId: string, status: TaskV2Status) => void;
  updateDetails: (taskId: string, updates: { title?: string; description?: string; isPriority?: boolean }) => void;
  approveTask: (taskId: string, approved: Record<string, Record<string, number>>) => void;
  deleteTask: (taskId: string) => void;
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  addComment: (taskId: string, message: string, author?: string) => void;
};

export default function Home({ fighters, categories, tasks, createTask, updateStatus, updateDetails, approveTask, deleteTask, fighterSkillLevels, addComment }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskV2 | null>(null);
  const [approved, setApproved] = useState<Record<string, Record<string, number>>>({});
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<TaskV2Status | null>(null);
  const [viewTaskId, setViewTaskId] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [priorityDraft, setPriorityDraft] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [expandedColumns, setExpandedColumns] = useState<Record<TaskV2Status, boolean>>({ ...DEFAULT_EXPANSION });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const skillIndex = useMemo(() => {
    const map = new Map<string, { name: string; categoryId: string }>();
    for (const c of categories) for (const s of c.skills) map.set(s.id, { name: s.name, categoryId: c.id });
    return map;
  }, [categories]);

  const fightersMap = useMemo(() => {
    const map = new Map<string, Fighter>();
    for (const fighter of fighters) map.set(fighter.id, fighter);
    return map;
  }, [fighters]);

  const viewedTask = useMemo(() => viewTaskId ? tasks.find(t => t.id === viewTaskId) ?? null : null, [tasks, viewTaskId]);

  const filteredTasks = useMemo(() => {
    if (assigneeFilter === 'all') return tasks;
    return tasks.filter(t => t.assignees.some(a => a.fighterId === assigneeFilter));
  }, [tasks, assigneeFilter]);

  const searchSuggestions = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return [] as TaskV2[];
    const numeric = Number(term.replace(/^#/, ''));
    return tasks.filter(task => {
      const titleMatch = (task.title ?? '').toLowerCase().includes(term);
      const numberMatch = Number.isFinite(numeric) && (task.taskNumber ?? -1) === numeric;
      return titleMatch || numberMatch;
    }).slice(0, 8);
  }, [tasks, searchQuery]);

  const toggleColumnExpansion = (status: TaskV2Status) => {
    setExpandedColumns(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const statusLabels = useMemo<Record<TaskV2Status, string>>(() => ({
    todo: 'To Do',
    in_progress: 'In Progress',
    validation: 'Validation',
    done: 'Done',
    archived: 'Archived'
  }), []);

  const formatDateTime = (value?: number) => value ? new Date(value).toLocaleString() : 'тАФ';

  const statusOptions: TaskV2Status[] = ['todo', 'in_progress', 'validation', 'done'];

  const StatusDropdown: React.FC<{ task: TaskV2 }> = ({ task }) => {
    const [open, setOpen] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (!open) return;
      const handleClickOutside = (event: MouseEvent) => {
        if (!menuRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const palette = statusBadge(task.status);

    return (
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={e => { e.stopPropagation(); setOpen(prev => !prev); }}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: `1px solid ${palette.border}`,
            background: palette.bg,
            color: palette.fg,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.fg, opacity: 0.8 }} />
          {statusLabels[task.status]}
        </button>
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--surface-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-md)',
              padding: 6,
              display: 'grid',
              gap: 4,
              zIndex: 5,
              minWidth: 160
            }}
          >
            {statusOptions.map(option => {
              const colors = statusBadge(option);
              return (
                <button
                  key={option}
                  onClick={() => { handleStatusSelect(task, option); setOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: option === task.status ? colors.bg : 'transparent',
                    color: option === task.status ? colors.fg : 'var(--fg)',
                    fontWeight: option === task.status ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.border }} />
                  {statusLabels[option]}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const statusBadge = (status: TaskV2Status) => {
    switch (status) {
      case 'todo':
        return { bg: 'rgba(148,163,184,0.28)', fg: '#e2e8f0', border: 'rgba(148,163,184,0.5)' };
      case 'in_progress':
        return { bg: 'linear-gradient(135deg, rgba(37,99,235,0.4) 0%, rgba(96,165,250,0.4) 100%)', fg: '#60a5fa', border: 'rgba(37,99,235,0.7)' };
      case 'validation':
        return { bg: 'rgba(250,204,21,0.35)', fg: '#fef08a', border: 'rgba(250,204,21,0.6)' };
      case 'done':
        return { bg: 'rgba(34,197,94,0.32)', fg: '#bbf7d0', border: 'rgba(34,197,94,0.6)' };
      default:
        return { bg: 'rgba(148,163,184,0.28)', fg: '#e2e8f0', border: 'rgba(148,163,184,0.5)' };
    }
  };

  function DetailCard({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 14, background: 'var(--surface-panel)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
      </div>
    );
  }

  const handleStatusSelect = (task: TaskV2, next: TaskV2Status) => {
    if (next === task.status) return;
    if (next === 'done') {
      if (task.status !== 'validation') {
        updateStatus(task.id, 'validation');
        openApproval({ ...task, status: 'validation' });
      } else {
        openApproval(task);
      }
      setViewTaskId(null);
      return;
    }
    updateStatus(task.id, next);
  };

  const byStatus = useMemo(() => ({
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    validation: filteredTasks.filter(t => t.status === 'validation'),
    done: filteredTasks.filter(t => t.status === 'done'),
    archived: filteredTasks.filter(t => t.status === 'archived').sort((a, b) => (b.approvedAt || b.createdAt || 0) - (a.approvedAt || a.createdAt || 0))
  }), [filteredTasks]);

  const activeCount = byStatus.in_progress.length + byStatus.validation.length;
  const noTasks = tasks.length === 0;
  const noFilteredMatches = !noTasks && filteredTasks.length === 0;

  function openApproval(task: TaskV2) {
    setSelectedTask(task);
    const init: Record<string, Record<string, number>> = {};
    for (const a of task.assignees) {
      init[a.fighterId] = {};
      for (const s of a.skills) init[a.fighterId][s.skillId] = s.xpApproved ?? s.xpSuggested;
    }
    setApproved(init);
    setApprovalComment('');
  }

  useEffect(() => {
    setCommentDraft('');
  }, [viewTaskId]);

  useEffect(() => {
    if (viewedTask) {
      setTitleDraft(viewedTask.title);
      setDescriptionDraft(viewedTask.description ?? '');
      setPriorityDraft(!!viewedTask.isPriority);
    } else {
      setTitleDraft('');
      setDescriptionDraft('');
      setPriorityDraft(false);
    }
  }, [viewedTask]);

  const trimmedTitle = titleDraft.trim();
  const trimmedDescription = descriptionDraft.trim();
  const titleError = trimmedTitle.length === 0;
  const detailsDirty = viewedTask ? (
    trimmedTitle !== viewedTask.title.trim() ||
    trimmedDescription !== (viewedTask.description ?? '').trim() ||
    priorityDraft !== !!viewedTask.isPriority
  ) : false;

  const handleSaveDetails = () => {
    if (!viewedTask) return;
    if (!trimmedTitle) return;
    const changeNotes: string[] = [];
    if (trimmedTitle !== viewedTask.title.trim()) changeNotes.push('╨╜╨░╨╖╨▓╤Г ╨╖╨░╨┤╨░╤З╤Ц');
    if (trimmedDescription !== (viewedTask.description ?? '').trim()) changeNotes.push('╨╛╨┐╨╕╤Б ╨╖╨░╨┤╨░╤З╤Ц');
    updateDetails(viewedTask.id, {
      title: trimmedTitle,
      description: trimmedDescription === '' ? undefined : descriptionDraft,
      isPriority: priorityDraft
    });
    if (changeNotes.length > 0) {
      const message = changeNotes.length === 2
        ? '╨Ю╨╜╨╛╨▓╨╗╨╡╨╜╨╛ ╨╜╨░╨╖╨▓╤Г ╤В╨░ ╨╛╨┐╨╕╤Б ╨╖╨░╨┤╨░╤З╤Ц'
        : `╨Ю╨╜╨╛╨▓╨╗╨╡╨╜╨╛ ${changeNotes[0]}`;
      addComment(viewedTask.id, message);
    }
  };

  const activityEntries = useMemo(() => {
    if (!viewedTask) return [] as ({ type: 'status'; entry: TaskStatusHistoryEntry } | { type: 'comment'; entry: TaskComment })[];
    const statusEntries = (viewedTask.history ?? []).map(entry => ({ type: 'status' as const, entry }));
    const commentEntries = (viewedTask.comments ?? []).map(entry => ({ type: 'comment' as const, entry }));
    return [...statusEntries, ...commentEntries].sort((a, b) => {
      const timeA = a.type === 'status' ? a.entry.changedAt : a.entry.createdAt;
      const timeB = b.type === 'status' ? b.entry.changedAt : b.entry.createdAt;
      return timeB - timeA;
    });
  }, [viewedTask]);

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--surface-panel-alt)', position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="╨Я╨╛╤И╤Г╨║ ╨╖╨░╨┤╨░╤З╤Ц ╨╖╨░ ╨╜╨░╨╖╨▓╨╛╤О ╨░╨▒╨╛ ╨╜╨╛╨╝╨╡╤А╨╛╨╝"
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
            {searchSuggestions.map(s => (
              <li
                key={s.id}
                onMouseDown={e => {
                  e.preventDefault();
                  setViewTaskId(s.id);
                  setSearchQuery('');
                }}
                data-testid={`task-suggestion-${s.id}`}
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
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>#{s.taskNumber ?? 'тАФ'}</span>
                  <span style={{ fontWeight: 600 }}>{s.title}</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{statusLabels[s.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 32 }}>╨Ф╨╛╤И╨║╨░ ╨╖╨░╨┤╨░╤З</h2>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{activeCount} ╨░╨║╤В╨╕╨▓╨╜╨╕╤Е ╨╖╨░╨┤╨░╤З</div>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>╨д╤Ц╨╗╤М╤В╤А ╨╖╨░ ╨▓╨╕╨║╨╛╨╜╨░╨▓╤Ж╨╡╨╝</span>
          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
          >
            <option value="all">╨г╤Б╤Ц ╨▓╨╕╨║╨╛╨╜╨░╨▓╤Ж╤Ц</option>
            {fighters.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setOpen(true)}
          style={{ padding: '12px 18px', borderRadius: 14, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, letterSpacing: '0.02em', boxShadow: 'var(--shadow-sm)' }}
        >+ ╨Э╨╛╨▓╨░ ╨╖╨░╨┤╨░╤З╨░</button>
      </header>

      {noTasks ? (
        <div style={{ flex: 1, borderRadius: 18, border: '1px dashed var(--border-subtle)', background: 'var(--surface-glass-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
          <EmptyState
            icon="ЁЯЧВя╕П"
            title="╨Я╨╛╨║╨╕ ╤Й╨╛ ╨╜╨╡╨╝╨░╤Ф ╨╖╨░╨┤╨░╤З"
            description="╨б╤В╨▓╨╛╤А╤Ц╤В╤М ╨┐╨╡╤А╤И╤Г ╨╖╨░╨┤╨░╤З╤Г, ╤Й╨╛╨▒ ╨▓╤Ц╨┤╤Б╤В╨╡╨╢╤Г╨▓╨░╤В╨╕ ╨┐╤А╨╛╨│╤А╨╡╤Б ╨▒╤Ц╨╣╤Ж╤Ц╨▓."
            action={{ label: '+ ╨б╤В╨▓╨╛╤А╨╕╤В╨╕ ╨╖╨░╨┤╨░╤З╤Г', onClick: () => setOpen(true) }}
          />
        </div>
      ) : noFilteredMatches ? (
        <div style={{ flex: 1, borderRadius: 18, border: '1px dashed var(--border-subtle)', background: 'var(--surface-glass-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
          <EmptyState
            icon="ЁЯХ╡я╕П"
            title="╨Э╨╡╨╝╨░╤Ф ╨╖╨░╨┤╨░╤З ╨╖╨░ ╨▓╨╕╨▒╤А╨░╨╜╨╕╨╝ ╨▓╨╕╨║╨╛╨╜╨░╨▓╤Ж╨╡╨╝"
            description="╨б╨┐╤А╨╛╨▒╤Г╨╣╤В╨╡ ╨▓╨╕╨▒╤А╨░╤В╨╕ ╤Ц╨╜╤И╨╛╨│╨╛ ╨▒╤Ц╨╣╤Ж╤П ╨░╨▒╨╛ ╤Б╨║╨╕╨╜╤Г╤В╨╕ ╤Д╤Ц╨╗╤М╤В╤А."
            action={assigneeFilter !== 'all' ? { label: '╨б╨║╨╕╨╜╤Г╤В╨╕ ╤Д╤Ц╨╗╤М╤В╤А', onClick: () => setAssigneeFilter('all') } : undefined}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))', gap: 18, minHeight: 0, flex: 1 }}>
          {BOARD_COLUMNS.map(([key, title]) => {
            const columnTasks = byStatus[key];
            const expanded = expandedColumns[key];
            const visibleTasks = expanded ? columnTasks : columnTasks.slice(0, COLUMN_VISIBLE_LIMIT);
            const hiddenCount = Math.max(columnTasks.length - COLUMN_VISIBLE_LIMIT, 0);
            return (
              <div
                key={key}
                onDragOver={(e) => { e.preventDefault(); setDropTargetStatus(key); }}
                onDragLeave={() => setDropTargetStatus(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedTaskId) {
                    const task = tasks.find(t => t.id === draggedTaskId);
                    if (task && task.status !== key) {
                      if (key === 'done') {
                        if (task.status !== 'validation') {
                          updateStatus(draggedTaskId, 'validation');
                        }
                        openApproval({ ...task, status: 'validation' });
                      } else {
                        updateStatus(draggedTaskId, key);
                      }
                    }
                  }
                  setDraggedTaskId(null);
                  setDropTargetStatus(null);
                }}
                style={{
                  borderRadius: 18,
                  padding: 14,
                  minHeight: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  background: dropTargetStatus === key
                    ? 'var(--surface-success-soft)'
                    : 'var(--surface-card)',
                  border: dropTargetStatus === key ? '1px solid var(--success-soft-border)' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-lg)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: statusBadge(key).fg }}>{title}</div>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: statusBadge(key).fg }}>{byStatus[key].length}</span>
                </div>
                <div style={{ display: 'grid', gap: 12, overflow: 'auto', paddingTop: 12 }}>
                  {visibleTasks.map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDraggedTaskId(t.id)}
                      onDragEnd={() => { setDraggedTaskId(null); setDropTargetStatus(null); }}
                      onClick={() => setViewTaskId(t.id)}
                      style={{
                        borderRadius: 14,
                        padding: 14,
                        background: draggedTaskId === t.id
                          ? 'var(--surface-accent-lift)'
                          : 'var(--surface-card-alt)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-md)',
                        cursor: 'grab',
                        opacity: draggedTaskId === t.id ? 0.55 : 1,
                        transition: 'opacity 0.15s ease, transform 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {t.isPriority && <span className="priority-indicator" title="╨Я╤А╤Ц╨╛╤А╨╕╤В╨╡╤В╨╜╨╛" aria-label="╨Я╤А╤Ц╨╛╤А╨╕╤В╨╡╤В╨╜╨╛" />}
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>#{t.taskNumber ?? 'тАФ'}</div>
                        <strong style={{ flex: 1, fontSize: 15 }}>{t.title}</strong>
                        {key === 'done' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              updateStatus(t.id, 'archived');
                            }}
                            title="╨Р╤А╤Е╤Ц╨▓╤Г╨▓╨░╤В╨╕"
                            style={{
                              padding: '4px 8px',
                              borderRadius: 999,
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--surface-panel)',
                              color: 'var(--muted)',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >╨Р╤А╤Е╤Ц╨▓</button>
                        )}
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-accent-pill)', border: '1px solid var(--surface-accent-pill-border)', color: 'var(--fg)' }}>тЪйя╕П {t.difficulty}</span>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {t.assignees.map(a => {
                          const fighter = fightersMap.get(a.fighterId);
                          if (!fighter) return null;
                          const label = fighter.callsign || fighter.name;
                          return (
                            <span
                              key={a.fighterId}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 999,
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--surface-panel)',
                                fontSize: 11,
                                fontWeight: 600
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--surface-accent-pill)', display: 'inline-block' }} />
                              {label}
                            </span>
                          );
                        })}
                      </div>
                      {t.comments?.length ? (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            ЁЯТм
                            <strong style={{ fontSize: 11, color: 'var(--fg)' }}>{t.comments[t.comments.length - 1]?.author}</strong>
                          </span>
                          <span>тАв</span>
                          <span>{formatDateTime(t.comments[t.comments.length - 1]?.createdAt)}</span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                {hiddenCount > 0 && (
                  <button
                    onClick={() => toggleColumnExpansion(key)}
                    style={{ marginTop: 8, alignSelf: 'center', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', fontSize: 12 }}
                  >
                    {expanded ? '╨Ч╨│╨╛╤А╨╜╤Г╤В╨╕ ╤Б╨┐╨╕╤Б╨╛╨║' : `╨Я╨╛╨║╨░╨╖╨░╤В╨╕ ╤Й╨╡ ${hiddenCount}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <MultiAssignTaskModal
        open={open}
        onClose={() => setOpen(false)}
        fighters={fighters}
        categories={categories}
        tasks={tasks}
        fighterSkillLevels={fighterSkillLevels}
        onCreate={({ title, description, difficulty, assignees, isPriority }) => {
          createTask({ title, description, difficulty, assignees, isPriority });
          setOpen(false);
        }}
      />

      <Modal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="╨Я╤Ц╨┤╤В╨▓╨╡╤А╨┤╨╢╨╡╨╜╨╜╤П XP"
        width={820}
        footer={selectedTask ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => setSelectedTask(null)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}>╨б╨║╨░╤Б╤Г╨▓╨░╤В╨╕</button>
            <button
              onClick={() => {
                const trimmedComment = approvalComment.trim();
                if (trimmedComment) {
                  addComment(selectedTask.id, trimmedComment);
                  setApprovalComment('');
                }
                approveTask(selectedTask.id, approved);
                setSelectedTask(null);
              }}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}
            >╨Ч╨░╤В╨▓╨╡╤А╨┤╨╕╤В╨╕</button>
          </div>
        ) : undefined}
      >
        {selectedTask && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ color: 'var(--muted)' }}>╨б╨║╨╛╤А╨╕╨│╤Г╨╣╤В╨╡ XP ╨┤╨╗╤П ╨║╨╛╨╢╨╜╨╛╨│╨╛ ╨▒╤Ц╨╣╤Ж╤П ╤В╨░ ╤Б╨║╤Ц╨╗╨░. Anti-exploit ╨╖╨╝╨╡╨╜╤И╤Г╤Ф ╤А╨╡╨║╨╛╨╝╨╡╨╜╨┤╨░╤Ж╤Ц╤Ч ╨┐╤А╨╕ ╨┐╨╛╨▓╤В╨╛╤А╤О╨▓╨░╨╜╨╕╤Е ╨╖╨░╨┤╨░╤З╨░╤Е.</div>
            {selectedTask.assignees.map(a => (
              <div key={a.fighterId} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{fighters.find(f => f.id === a.fighterId)?.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                  {a.skills.map(s => {
                    const rep = repetitionFactorFromTasks(tasks, { fighterId: a.fighterId, skillId: s.skillId, difficulty: selectedTask.difficulty, title: selectedTask.title });
                    return (
                      <React.Fragment key={s.skillId}>
                        <div>{skillIndex.get(s.skillId)?.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            value={approved[a.fighterId]?.[s.skillId] ?? s.xpSuggested}
                            onChange={e => setApproved(prev => ({ ...prev, [a.fighterId]: { ...(prev[a.fighterId] ?? {}), [s.skillId]: Number(e.target.value) || 0 } }))}
                            style={{ width: 100, padding: 6 }}
                          />
                          <span title={`╨Р╨╜╤В╨╕-╨╡╨║╤Б╨┐╨╗╨╛╨╣╤В: ${rep.count} ╤Б╤Е╨╛╨╢╨╕╤Е ╨╖╨░ ${3} ╨┤╨╜╤Ц`} style={{ fontSize: 11, color: 'var(--muted)' }}>тИТ{Math.round((1 - rep.factor)*100)}%</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
            <label style={{ display: 'grid', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>╨Ъ╨╛╨╝╨╡╨╜╤В╨░╤А ╨┤╨╛ ╨╖╨░╨┤╨░╤З╤Ц</span>
              <textarea
                value={approvalComment}
                onChange={e => setApprovalComment(e.target.value)}
                rows={3}
                placeholder="╨Ф╨╛╨┤╨░╨╣╤В╨╡ ╨║╨╛╤А╨╛╤В╨║╨╕╨╣ ╤Д╤Ц╨┤╨▒╨╡╨║ ╨┤╨╗╤П ╨▓╨╕╨║╨╛╨╜╨░╨▓╤Ж╤Ц╨▓"
                style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', resize: 'vertical' }}
              />
            </label>
            <button
              onClick={() => {
                const trimmed = approvalComment.trim();
                if (!trimmed) return;
                addComment(selectedTask.id, trimmed);
                setApprovalComment('');
              }}
              style={{ justifySelf: 'flex-end', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)', color: 'var(--fg)', fontSize: 12 }}
              disabled={!approvalComment.trim()}
            >╨Ф╨╛╨┤╨░╤В╨╕ ╨║╨╛╨╝╨╡╨╜╤В╨░╤А</button>
          </div>
        )}
      </Modal>

      <Modal
        open={!!viewedTask}
        onClose={() => setViewTaskId(null)}
        title={viewedTask ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{ flex: 1, display: 'grid', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>╨Э╨░╨╖╨▓╨░</label>
              <input
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                placeholder="╨Э╨░╨╖╨▓╨░ ╨╖╨░╨┤╨░╤З╤Ц"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: titleError ? '1px solid var(--danger-soft-border)' : '1px solid var(--border-subtle)',
                  background: 'var(--surface-panel)',
                  color: 'var(--fg)',
                  fontSize: 16,
                  fontWeight: 600
                }}
              />
              {titleError && <span style={{ fontSize: 11, color: 'var(--danger-soft-border)' }}>╨Э╨░╨╖╨▓╨░ ╨╜╨╡ ╨╝╨╛╨╢╨╡ ╨▒╤Г╤В╨╕ ╨┐╨╛╤А╨╛╨╢╨╜╤М╨╛╤О</span>}
            </div>
            <StatusDropdown task={viewedTask} />
          </div>
        ) : '╨Ч╨░╨┤╨░╤З╨░'}
        width={820}
        footer={viewedTask ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleSaveDetails}
              disabled={!detailsDirty || titleError}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--success-soft-border)', background: detailsDirty && !titleError ? 'var(--success-soft-bg)' : 'var(--surface-panel)', color: 'var(--fg)', fontWeight: 600, opacity: (!detailsDirty || titleError) ? 0.5 : 1 }}
            >╨Ч╨▒╨╡╤А╨╡╨│╤В╨╕</button>
            <button onClick={() => setViewTaskId(null)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}>╨Ч╨░╨║╤А╨╕╤В╨╕</button>
            <button
              onClick={() => {
                if (viewedTask && confirm(`╨Т╨╕╨┤╨░╨╗╨╕╤В╨╕ ╨╖╨░╨┤╨░╤З╤Г ┬л${viewedTask.title}┬╗?`)) {
                  deleteTask(viewedTask.id);
                  setViewTaskId(null);
                }
              }}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--danger-soft-bg)', border: '1px solid var(--danger-soft-border)', color: 'var(--fg)', fontWeight: 600 }}
              aria-label={`╨Т╨╕╨┤╨░╨╗╨╕╤В╨╕ ╨╖╨░╨┤╨░╤З╤Г ┬л${viewedTask?.title ?? ''}┬╗`}
            >╨Т╨╕╨┤╨░╨╗╨╕╤В╨╕</button>
          </div>
        ) : undefined}
      >
        {viewedTask && (
          <div style={{ display: 'grid', gap: 24 }}>
            <section style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, background: 'var(--surface-panel-alt)', padding: 18, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: 16 }}>╨Ю╨┐╨╕╤Б</strong>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>╨Ф╨╡╤В╨░╨╗╤Ц ╨╖╨░╨┤╨░╤З╤Ц</span>
              </div>
              <textarea
                value={descriptionDraft}
                onChange={e => setDescriptionDraft(e.target.value)}
                rows={5}
                placeholder="╨Ф╨╛╨┤╨░╨╣╤В╨╡ ╨╛╨┐╨╕╤Б ╨╖╨░╨┤╨░╤З╤Ц"
                style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', resize: 'vertical', minHeight: 120 }}
              />
            </section>

            <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 6 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={priorityDraft} onChange={e => setPriorityDraft(e.target.checked)} />
                <span style={{ fontWeight: 600, color: 'var(--fg)' }}>╨Я╤А╤Ц╨╛╤А╨╕╤В╨╡╤В╨╜╨╛</span>
              </label>
              {priorityDraft && <span style={{ fontSize: 12, color: 'var(--muted)', flex: '1 1 220px' }}>╨Ч╨░╨┤╨░╤З╨░ ╨▒╤Г╨┤╨╡ ╨┐╨╛╨╖╨╜╨░╤З╨╡╨╜╨░ ╤П╨║ ╤В╨╡╤А╨╝╤Ц╨╜╨╛╨▓╨░ ╨╜╨░ ╨┤╨╛╤И╤Ж╤Ц</span>}
            </section>

            <section style={{ display: 'grid', gap: 16 }}>
              <strong style={{ fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>╨Ф╨╡╤В╨░╨╗╤Ц</strong>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <DetailCard label="╨б╨║╨╗╨░╨┤╨╜╤Ц╤Б╤В╤М" value={`тЪйя╕П ${viewedTask.difficulty}`} />
              </div>
            </section>

            <section style={{ display: 'grid', gap: 16 }}>
              <strong style={{ fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>╨Т╨╕╨║╨╛╨╜╨░╨▓╤Ж╤Ц ╤В╨░ XP</strong>
              {viewedTask.assignees.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>╨Т╨╕╨║╨╛╨╜╨░╨▓╤Ж╤Ц╨▓ ╨╜╨╡╨╝╨░╤Ф.</div>
              ) : (
                viewedTask.assignees.map(a => {
                  const fighter = fighters.find(f => f.id === a.fighterId);
                  return (
                    <div key={a.fighterId} style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, background: 'var(--surface-panel)', padding: 16, display: 'grid', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div>
                          <strong style={{ fontSize: 15 }}>{fighter?.name || '╨Э╨╡╨▓╤Ц╨┤╨╛╨╝╨╕╨╣ ╨▒╨╛╤Ф╤Ж╤М'}</strong>
                          {(fighter?.callsign || fighter?.rank) && (
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              {[fighter?.callsign, fighter?.rank].filter(Boolean).join(' тАв ')}
                            </div>
                          )}
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{a.skills.length} ╤Б╨║╤Ц╨╗╤Ц╨▓</span>
                      </div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {a.skills.map(s => {
                          const skillMeta = skillIndex.get(s.skillId);
                          const categoryName = skillMeta ? categories.find(c => c.id === skillMeta.categoryId)?.name : undefined;
                          return (
                            <div key={s.skillId} style={{ border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 12, background: 'var(--surface-panel-alt)', display: 'grid', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <strong style={{ flex: 1 }}>{skillMeta?.name || s.skillId}</strong>
                                {categoryName && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{categoryName}</span>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--muted)' }}>
                                <span>╨а╨╡╨║╨╛╨╝╨╡╨╜╨┤╨╛╨▓╨░╨╜╨╛: {s.xpSuggested} XP</span>
                                <span>╨Ч╨░╤В╨▓╨╡╤А╨┤╨╢╨╡╨╜╨╛: {s.xpApproved ?? 'тАФ'} XP</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            <section style={{ display: 'grid', gap: 12 }}>
              <strong style={{ fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>╨Ж╤Б╤В╨╛╤А╤Ц╤П ╤Б╤В╨░╤В╤Г╤Б╤Ц╨▓</strong>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {activityEntries.map((item, idx) => {
                  if (item.type === 'status') {
                    const { fromStatus, toStatus, changedAt } = item.entry;
                    const fromLabel = fromStatus ? statusLabels[fromStatus as TaskV2Status] : '╨б╤В╨▓╨╛╤А╨╡╨╜╨╛';
                    const toLabel = statusLabels[toStatus];
                    return (
                      <li key={`status-${toStatus}-${changedAt}-${idx}`} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 12px', background: 'var(--surface-panel-alt)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fromLabel} тЖТ</span>
                        <span style={{ fontWeight: 600 }}>{toLabel}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{formatDateTime(changedAt)}</span>
                      </li>
                    );
                  }
                  const { author, message, createdAt, id } = item.entry;
                  return (
                    <li key={`comment-${id}-${idx}`} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px', background: 'var(--surface-panel)', display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 13 }}>{author}</strong>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{formatDateTime(createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--fg)' }}>{message}</div>
                    </li>
                  );
                })}
                {activityEntries.length === 0 && <li style={{ fontSize: 13, color: 'var(--muted)' }}>╨Ч╨░╨┐╨╕╤Б╤Ц╨▓ ╨┐╨╛╨║╨╕ ╨╜╨╡╨╝╨░╤Ф.</li>}
              </ul>
            </section>

            <section style={{ display: 'grid', gap: 10 }}>
              <strong style={{ fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>╨Ф╨╛╨┤╨░╤В╨╕ ╨║╨╛╨╝╨╡╨╜╤В╨░╤А</strong>
              <textarea
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                rows={3}
                placeholder="╨Я╨╛╨┤╤Ц╨╗╨╕╤В╨╕╤Б╤П ╨╛╨╜╨╛╨▓╨╗╨╡╨╜╨╜╤П╨╝ ╨░╨▒╨╛ ╤А╤Ц╤И╨╡╨╜╨╜╤П╨╝ ╨┐╨╛ ╨╖╨░╨┤╨░╤З╤Ц"
                style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    if (!viewedTask) return;
                    const trimmed = commentDraft.trim();
                    if (!trimmed) return;
                    addComment(viewedTask.id, trimmed);
                    setCommentDraft('');
                  }}
                  disabled={!commentDraft.trim()}
                  style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)', color: 'var(--fg)', fontWeight: 600 }}
                >╨Ч╨░╨╗╨╕╤И╨╕╤В╨╕ ╨║╨╛╨╝╨╡╨╜╤В╨░╤А</button>
              </div>
            </section>

          </div>
        )}
      </Modal>
      <section style={{ marginTop: 12 }}>
        <details style={{ fontSize: 12, color: 'var(--muted)' }}>
          <summary style={{ cursor: 'pointer' }}>╨Р╤А╤Е╤Ц╨▓ ╨╖╨░╨┤╨░╤З ({byStatus.archived.length})</summary>
          <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
            {byStatus.archived.map(task => (
              <li
                key={task.id}
                onClick={() => setViewTaskId(task.id)}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '8px 10px',
                  background: 'var(--surface-panel-alt)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: 8
                }}
              >
                <span style={{ display: 'grid' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>#{task.taskNumber ?? 'тАФ'}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{formatDateTime(task.approvedAt ?? task.submittedAt ?? task.createdAt)}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      updateStatus(task.id, 'todo');
                    }}
                    style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', fontSize: 11 }}
                  >╨Я╨╛╨▓╨╡╤А╨╜╤Г╤В╨╕</button>
                </div>
              </li>
            ))}
            {byStatus.archived.length === 0 && <li style={{ padding: 8 }}>╨Р╤А╤Е╤Ц╨▓ ╨┐╨╛╤А╨╛╨╢╨╜╤Ц╨╣.</li>}
          </ul>
        </details>
      </section>
    </div>
  );
}
