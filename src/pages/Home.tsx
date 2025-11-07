import React, { useEffect, useMemo, useState } from 'react';
import { Category, Fighter, FighterSkillLevels, TaskV2, TaskV2Assignee, TaskV2Status, TaskComment, TaskStatusHistoryEntry } from '@/types';
import MultiAssignTaskModal from '@/components/MultiAssignTaskModal';
import { Modal } from '@/components/Modal';
import { repetitionFactorFromTasks } from '@/utils';
import { EmptyState } from '@/components/EmptyState';

type Props = {
  fighters: Fighter[];
  categories: Category[];
  tasks: TaskV2[];
  createTask: (payload: { title: string; description?: string; difficulty: 1|2|3|4|5; assignees: TaskV2Assignee[] }) => void;
  updateStatus: (taskId: string, status: TaskV2Status) => void;
  updateDetails: (taskId: string, updates: { title?: string; description?: string }) => void;
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

  const skillIndex = useMemo(() => {
    const map = new Map<string, { name: string; categoryId: string }>();
    for (const c of categories) for (const s of c.skills) map.set(s.id, { name: s.name, categoryId: c.id });
    return map;
  }, [categories]);

  const viewedTask = useMemo(() => viewTaskId ? tasks.find(t => t.id === viewTaskId) ?? null : null, [tasks, viewTaskId]);

  const statusLabels = useMemo<Record<TaskV2Status, string>>(() => ({
    todo: 'To Do',
    in_progress: 'In Progress',
    validation: 'Validation',
    done: 'Done',
    archived: 'Archived'
  }), []);

  const formatDateTime = (value?: number) => value ? new Date(value).toLocaleString() : '—';

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
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    validation: tasks.filter(t => t.status === 'validation'),
    done: tasks.filter(t => t.status === 'done'),
    archived: tasks.filter(t => t.status === 'archived').sort((a, b) => (b.approvedAt || b.createdAt || 0) - (a.approvedAt || a.createdAt || 0))
  }), [tasks]);

  const activeCount = byStatus.in_progress.length + byStatus.validation.length;

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
    } else {
      setTitleDraft('');
      setDescriptionDraft('');
    }
  }, [viewedTask]);

  const trimmedTitle = titleDraft.trim();
  const trimmedDescription = descriptionDraft.trim();
  const titleError = trimmedTitle.length === 0;
  const detailsDirty = viewedTask ? (
    trimmedTitle !== viewedTask.title.trim() ||
    trimmedDescription !== (viewedTask.description ?? '').trim()
  ) : false;

  const handleSaveDetails = () => {
    if (!viewedTask) return;
    if (!trimmedTitle) return;
    updateDetails(viewedTask.id, {
      title: trimmedTitle,
      description: trimmedDescription === '' ? undefined : descriptionDraft
    });
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
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--surface-panel-alt)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 32 }}>Дошка задач</h2>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{activeCount} активних задач</div>
        </div>
        <button
          onClick={() => setOpen(true)}
          style={{ padding: '12px 18px', borderRadius: 14, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, letterSpacing: '0.02em', boxShadow: 'var(--shadow-sm)' }}
        >+ Нова задача</button>
      </header>

      {tasks.length === 0 ? (
        <div style={{ flex: 1, borderRadius: 18, border: '1px dashed var(--border-subtle)', background: 'var(--surface-glass-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
          <EmptyState
            icon="🗂️"
            title="Поки що немає задач"
            description="Створіть першу задачу, щоб відстежувати прогрес бійців."
            action={{ label: '+ Створити задачу', onClick: () => setOpen(true) }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))', gap: 18, minHeight: 0, flex: 1 }}>
          {([['todo','To Do'],['in_progress','In Progress'],['validation','Validation'],['done','Done']] as [TaskV2Status,string][]) .map(([key, title]) => (
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
                {byStatus[key].map(t => (
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
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>#{t.taskNumber ?? '—'}</div>
                      <strong style={{ flex: 1, fontSize: 15 }}>{t.title}</strong>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-accent-pill)', border: '1px solid var(--surface-accent-pill-border)', color: 'var(--fg)' }}>⚩️ {t.difficulty}</span>
                    </div>
                    <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                      {t.assignees.map(a => (
                        <div key={a.fighterId} style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--muted)' }}>Виконавець:</span>
                          <span style={{ fontWeight: 600, color: 'var(--fg)' }}>{fighters.find(f => f.id === a.fighterId)?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <MultiAssignTaskModal
        open={open}
        onClose={() => setOpen(false)}
        fighters={fighters}
        categories={categories}
        tasks={tasks}
        fighterSkillLevels={fighterSkillLevels}
        onCreate={({ title, description, difficulty, assignees }) => {
          createTask({ title, description, difficulty, assignees });
          setOpen(false);
        }}
      />

      <Modal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Підтвердження XP"
        width={820}
        footer={selectedTask ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => setSelectedTask(null)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}>Скасувати</button>
            <button
              onClick={() => { approveTask(selectedTask.id, approved); setSelectedTask(null); }}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}
            >Затвердити</button>
          </div>
        ) : undefined}
      >
        {selectedTask && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ color: 'var(--muted)' }}>Скоригуйте XP для кожного бійця та скіла. Anti-exploit зменшує рекомендації при повторюваних задачах.</div>
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
                          <span title={`Анти-експлойт: ${rep.count} схожих за ${3} дні`} style={{ fontSize: 11, color: 'var(--muted)' }}>−{Math.round((1 - rep.factor)*100)}%</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
            <label style={{ display: 'grid', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Коментар до задачі</span>
              <textarea
                value={approvalComment}
                onChange={e => setApprovalComment(e.target.value)}
                rows={3}
                placeholder="Додайте короткий фідбек для виконавців"
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
            >Додати коментар</button>
          </div>
        )}
      </Modal>

      <Modal
        open={!!viewedTask}
        onClose={() => setViewTaskId(null)}
        title={viewedTask ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{ flex: 1, display: 'grid', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Назва</label>
              <input
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                placeholder="Назва задачі"
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
              {titleError && <span style={{ fontSize: 11, color: 'var(--danger-soft-border)' }}>Назва не може бути порожньою</span>}
            </div>
            <StatusDropdown task={viewedTask} />
          </div>
        ) : 'Задача'}
        width={820}
        footer={viewedTask ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleSaveDetails}
              disabled={!detailsDirty || titleError}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--success-soft-border)', background: detailsDirty && !titleError ? 'var(--success-soft-bg)' : 'var(--surface-panel)', color: 'var(--fg)', fontWeight: 600, opacity: (!detailsDirty || titleError) ? 0.5 : 1 }}
            >Зберегти</button>
            <button onClick={() => setViewTaskId(null)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}>Закрити</button>
            <button
              onClick={() => {
                if (viewedTask && confirm(`Видалити задачу «${viewedTask.title}»?`)) {
                  deleteTask(viewedTask.id);
                  setViewTaskId(null);
                }
              }}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--danger-soft-bg)', border: '1px solid var(--danger-soft-border)', color: 'var(--fg)', fontWeight: 600 }}
              aria-label={`Видалити задачу «${viewedTask?.title ?? ''}»`}
            >Видалити</button>
          </div>
        ) : undefined}
      >
        {viewedTask && (
          <div style={{ display: 'grid', gap: 24 }}>
            <section style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, background: 'var(--surface-panel-alt)', padding: 18, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: 16 }}>Опис</strong>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Деталі задачі</span>
              </div>
              <textarea
                value={descriptionDraft}
                onChange={e => setDescriptionDraft(e.target.value)}
                rows={5}
                placeholder="Додайте опис задачі"
                style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', resize: 'vertical', minHeight: 120 }}
              />
            </section>

            <section style={{ display: 'grid', gap: 16 }}>
              <strong style={{ fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Деталі</strong>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <DetailCard label="Складність" value={`⚩️ ${viewedTask.difficulty}`} />
              </div>
            </section>

            <section style={{ display: 'grid', gap: 16 }}>
              <strong style={{ fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Виконавці та XP</strong>
              {viewedTask.assignees.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Виконавців немає.</div>
              ) : (
                viewedTask.assignees.map(a => {
                  const fighter = fighters.find(f => f.id === a.fighterId);
                  return (
                    <div key={a.fighterId} style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, background: 'var(--surface-panel)', padding: 16, display: 'grid', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div>
                          <strong style={{ fontSize: 15 }}>{fighter?.name || 'Невідомий боєць'}</strong>
                          {(fighter?.callsign || fighter?.rank) && (
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              {[fighter?.callsign, fighter?.rank].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{a.skills.length} скілів</span>
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
                                <span>Рекомендовано: {s.xpSuggested} XP</span>
                                <span>Затверджено: {s.xpApproved ?? '—'} XP</span>
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
              <strong style={{ fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Історія статусів</strong>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {activityEntries.map((item, idx) => {
                  if (item.type === 'status') {
                    const { fromStatus, toStatus, changedAt } = item.entry;
                    const fromLabel = fromStatus ? statusLabels[fromStatus as TaskV2Status] : 'Створено';
                    const toLabel = statusLabels[toStatus];
                    return (
                      <li key={`status-${toStatus}-${changedAt}-${idx}`} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 12px', background: 'var(--surface-panel-alt)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fromLabel} →</span>
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
                {activityEntries.length === 0 && <li style={{ fontSize: 13, color: 'var(--muted)' }}>Записів поки немає.</li>}
              </ul>
            </section>

            <section style={{ display: 'grid', gap: 10 }}>
              <strong style={{ fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Додати коментар</strong>
              <textarea
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                rows={3}
                placeholder="Поділитися оновленням або рішенням по задачі"
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
                >Залишити коментар</button>
              </div>
            </section>

          </div>
        )}
      </Modal>
      <section style={{ marginTop: 12 }}>
        <details style={{ fontSize: 12, color: 'var(--muted)' }}>
          <summary style={{ cursor: 'pointer' }}>Архів задач ({byStatus.archived.length})</summary>
          <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
            {byStatus.archived.map(task => (
              <li key={task.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 10px', background: 'var(--surface-panel-alt)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>#{task.taskNumber ?? '—'} · {task.title}</span>
                <button
                  onClick={() => updateStatus(task.id, 'todo')}
                  style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', fontSize: 11 }}
                >Повернути</button>
              </li>
            ))}
            {byStatus.archived.length === 0 && <li style={{ padding: 8 }}>Архів порожній.</li>}
          </ul>
        </details>
      </section>
    </div>
  );
}
