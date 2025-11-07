import { Category, Fighter, Skill, UserTask, UserTaskStatus } from '@/types';
import { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { CreateTaskModal } from './CreateTaskModal';

type CreateTask = {
  title: string;
  description?: string;
  difficulty?: 1|2|3|4|5;
  links: { skillId: string; categoryId: string; xp: number }[];
};

type Props = {
  fighters: Fighter[];
  selectedFighterId: string | null;
  onSelectFighter: (id: string | null) => void;
  categories: Category[];
  tasks: UserTask[];
  fighterSkills: Record<string, Record<string, boolean>>;
  onCreateTask: (payload: CreateTask) => void;
  onUpdateStatus: (taskId: string, status: UserTaskStatus) => void;
  onApproveTask: (taskId: string, approvedXp: Record<string, number>) => void;
};

export function TaskBoard({ fighters, selectedFighterId, onSelectFighter, categories, tasks, fighterSkills, onCreateTask, onUpdateStatus, onApproveTask }: Props) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<{ skillId: string; categoryId: string; xp: number }[]>([]);

  const skillIndex = useMemo(() => {
    const map = new Map<string, { skill: Skill; categoryId: string }>();
    for (const c of categories) for (const s of c.skills) map.set(s.id, { skill: s, categoryId: c.id });
    return map;
  }, [categories]);

  const list = useMemo(() => tasks.filter(t => t.assignedTo === selectedFighterId), [tasks, selectedFighterId]);

  function normStatus(s?: UserTaskStatus): 'todo'|'in_progress'|'validation'|'done' {
    if (s === 'draft' || s === undefined) return 'todo';
    if (s === 'submitted') return 'validation';
    if (s === 'approved') return 'done';
    if (s === 'todo' || s === 'in_progress' || s === 'validation' || s === 'done') return s;
    return 'todo';
  }

  const columns: { key: 'todo'|'in_progress'|'validation'|'done'; title: string }[] = [
    { key: 'todo', title: 'To Do' },
    { key: 'in_progress', title: 'In Progress' },
    { key: 'validation', title: 'Validation' },
    { key: 'done', title: 'Done' }
  ];

  function addLink(skillId: string) {
    if (!skillIndex.has(skillId)) return;
    if (links.some(l => l.skillId === skillId)) return;
    const { categoryId } = skillIndex.get(skillId)!;
    setLinks(prev => [...prev, { skillId, categoryId, xp: 10 }]);
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>Боєць:</label>
        <select value={selectedFighterId ?? ''} onChange={e => onSelectFighter(e.target.value || null)} style={{ padding: '6px 8px' }}>
          <option value="">— не вибрано —</option>
          {fighters.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
        </select>
        <button onClick={() => setOpen(true)} disabled={!selectedFighterId}>+ Створити задачу</button>
      </div>

      <div>
        <h3 style={{ margin: '8px 0' }}>Задачі (Kanban)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {columns.map(col => (
            <div key={col.key} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8, minHeight: 200 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{col.title}</div>
              {list.filter(t => normStatus(t.status) === col.key).map(t => (
                <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8, marginBottom: 8, background: 'var(--card-bg)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <strong>{t.title}</strong>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{t.difficulty ? `⚩️${t.difficulty}` : ''}</span>
                  </div>
                  {t.description && <div style={{ marginTop: 6, fontSize: 13 }}>{t.description}</div>}
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {t.relatedSkills.map(sk => {
                      const found = skillIndex.get(sk.skillId);
                      const xp = t.approvedXp?.[sk.skillId] ?? t.suggestedXp[sk.skillId] ?? 0;
                      return (
                        <span key={sk.skillId} style={{ fontSize: 12, padding: '2px 6px', background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 999 }}>
                          {found?.skill.name} · {xp} XP
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {col.key === 'todo' && (
                      <>
                        <button onClick={() => onUpdateStatus(t.id, 'in_progress')}>В роботу</button>
                        <button onClick={() => onUpdateStatus(t.id, 'validation')}>На перевірку</button>
                      </>
                    )}
                    {col.key === 'in_progress' && (
                      <>
                        <button onClick={() => onUpdateStatus(t.id, 'validation')}>На перевірку</button>
                        <button onClick={() => onUpdateStatus(t.id, 'todo')}>Відкласти</button>
                      </>
                    )}
                    {col.key === 'validation' && (
                      <>
                        <button onClick={() => {
                          const approved: Record<string, number> = {};
                          for (const sk of t.relatedSkills) {
                            const s = prompt(`XP для ${skillIndex.get(sk.skillId)?.skill.name}`, String(t.suggestedXp[sk.skillId] ?? 0));
                            if (s == null) return;
                            approved[sk.skillId] = Math.max(0, Number(s) || 0);
                          }
                          onApproveTask(t.id, approved);
                        }}>Затвердити</button>
                        <button onClick={() => onUpdateStatus(t.id, 'in_progress')}>Повернути</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <CreateTaskModal
        open={open}
        onClose={() => setOpen(false)}
        fighter={fighters.find(f => f.id === selectedFighterId)}
        categories={categories}
        fighterSkills={fighterSkills}
        onCreate={({ title, description, difficulty, links }) => {
          onCreateTask({ title, description, difficulty, links });
        }}
      />
    </div>
  );
}

