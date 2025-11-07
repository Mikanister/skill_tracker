import React, { useMemo, useState } from 'react';
import { Category, Fighter, FighterSkillLevels, TaskV2, TaskV2Assignee, TaskV2AssigneeSkill } from '@/types';
import { Modal } from './Modal';
import { computeSuggestedXp, repetitionFactorFromTasks } from '@/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  fighters: Fighter[];
  categories: Category[];
  tasks?: TaskV2[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  onCreate: (payload: { title: string; description?: string; difficulty: 1|2|3|4|5; assignees: TaskV2Assignee[] }) => void;
};

export default function MultiAssignTaskModal({ open, onClose, fighters, categories, tasks = [], fighterSkillLevels, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<1|2|3|4|5>(3);
  const [selectedFighters, setSelectedFighters] = useState<Record<string, boolean>>({});
  const [assigneeSkills, setAssigneeSkills] = useState<Record<string, Record<string, number>>>({}); // fighterId -> skillId -> xp
  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const skillIndex = useMemo(() => {
    const map = new Map<string, { name: string; categoryId: string }>();
    for (const c of categories) for (const s of c.skills) map.set(s.id, { name: s.name, categoryId: c.id });
    return map;
  }, [categories]);

  function toggleFighter(fid: string, checked: boolean) {
    setSelectedFighters(prev => ({ ...prev, [fid]: checked }));
    if (!checked) setAssigneeSkills(prev => { const n = { ...prev }; delete n[fid]; return n; });
  }

  function computeLineXp(fid: string, skillId: string, difficultyOverride?: 1|2|3|4|5): number {
    const lvl = (fighterSkillLevels[fid]?.[skillId] ?? 0);
    const diff = difficultyOverride ?? difficulty;
    const rep = repetitionFactorFromTasks(tasks, { fighterId: fid, skillId, difficulty: diff, title });
    const repetitionCount = Math.max(1, rep.count);
    const base = computeSuggestedXp({ difficulty: diff, isNovice: lvl <= 1, challenge: 0, qualityAdj: 0, repetitionCount });
    return Math.round(base * rep.factor); // apply factor again for clarity (rep.count already handled inside computeSuggestedXp as count; doubling intentionally increases effect) 
  }

  function toggleSkill(fid: string, skillId: string, checked: boolean) {
    setAssigneeSkills(prev => {
      const row = { ...(prev[fid] ?? {}) };
      if (checked) {
        const xp = computeLineXp(fid, skillId);
        row[skillId] = xp;
      } else {
        delete row[skillId];
      }
      return { ...prev, [fid]: row };
    });
  }

  // Recompute suggestions when title or difficulty changes for already checked skills
  function recomputeForAllChecked(difficultyOverride?: 1|2|3|4|5) {
    setAssigneeSkills(prev => {
      const next: typeof prev = {} as any;
      for (const [fid, rows] of Object.entries(prev)) {
        const updated: Record<string, number> = {};
        for (const skillId of Object.keys(rows)) {
          updated[skillId] = computeLineXp(fid, skillId, difficultyOverride);
        }
        next[fid] = updated;
      }
      return next;
    });
  }

  const filteredFighters = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return fighters;
    return fighters.filter(f => f.name.toLowerCase().includes(term));
  }, [fighters, search]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Нова задача (кілька виконавців)"
      width={820}
      footer={(
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', fontWeight: 500 }}
          >Скасувати</button>
          <button
            onClick={() => {
              const assignees: TaskV2Assignee[] = Object.keys(selectedFighters)
                .filter(fid => selectedFighters[fid])
                .map(fid => {
                  const entries = Object.entries(assigneeSkills[fid] ?? {});
                  const skills: TaskV2AssigneeSkill[] = entries.map(([skillId, xp]) => ({
                    skillId,
                    categoryId: skillIndex.get(skillId)?.categoryId || '',
                    xpSuggested: Math.max(0, Math.round(xp))
                  }));
                  return { fighterId: fid, skills };
                })
                .filter(a => a.skills.length > 0);
              if (!title.trim()) {
                setFormError('Вкажіть назву задачі.');
                return;
              }
              if (assignees.length === 0) {
                setFormError('Оберіть хоча б одного виконавця та додайте йому навички.');
                return;
              }
              onCreate({ title: title.trim(), description: description.trim(), difficulty, assignees });
              setTitle(''); setDescription(''); setSelectedFighters({}); setAssigneeSkills({}); setSearch(''); setDifficulty(3); onClose();
              setFormError(null);
            }}
            disabled={!title.trim()}
            style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, boxShadow: 'var(--shadow-sm)', opacity: title.trim() ? 1 : 0.6 }}
          >
            Створити задачу
          </button>
        </div>
      )}
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Назва</span>
            <input value={title} onChange={e => { setTitle(e.target.value); recomputeForAllChecked(); }} placeholder="Вкажіть назву" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }} />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Складність</span>
            <select value={difficulty} onChange={e => {
              const nextDifficulty = Number(e.target.value) as 1|2|3|4|5;
              setDifficulty(nextDifficulty);
              recomputeForAllChecked(nextDifficulty);
            }} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }}>
              {[1,2,3,4,5].map(n => (<option key={n} value={n}>{n}</option>))}
            </select>
          </label>
        </div>
        <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Опис</span>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Додайте короткий опис" style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }} />
        </label>
        {formError && <div style={{ color: 'var(--fg)', fontSize: 13, padding: '8px 12px', borderRadius: 10, background: 'var(--danger-soft-bg)', border: '1px solid var(--danger-soft-border)' }}>{formError}</div>}
        <section style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong style={{ flex: 1, fontSize: 15 }}>Виконавці</strong>
            <input placeholder="Пошук бійця" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }} />
          </div>
          <div style={{ maxHeight: 280, overflow: 'auto', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', padding: 12, display: 'grid', gap: 8 }}>
            {filteredFighters.length === 0 ? (
              <span style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>Бійців не знайдено</span>
            ) : (
              filteredFighters.map(f => (
                <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: selectedFighters[f.id] ? 'var(--accent-soft-pill)' : 'var(--surface-panel-alt)', border: '1px solid var(--border-subtle)', transition: 'all 0.15s ease' }}>
                  <input type="checkbox" checked={!!selectedFighters[f.id]} onChange={e => toggleFighter(f.id, e.target.checked)} />
                  <span style={{ fontSize: 13, color: 'var(--fg)' }}>{f.callsign || f.fullName || f.name}</span>
                </label>
              ))
            )}
          </div>
        </section>

        <section style={{ display: 'grid', gap: 12 }}>
          <strong style={{ fontSize: 15 }}>Скіли та XP по кожному бійцю</strong>
          <div style={{ maxHeight: 520, overflow: 'auto', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', padding: 14, display: 'grid', gap: 16 }}>
            {fighters.filter(f => selectedFighters[f.id]).map(f => (
              <div key={f.id} style={{ borderRadius: 14, border: '1px solid var(--border-subtle)', padding: 14, background: 'var(--surface-card)', display: 'grid', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{f.callsign || f.fullName || f.name}</div>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{Object.keys(assigneeSkills[f.id] ?? {}).length} навичок</div>
                </div>
                {categories.map(cat => (
                  <div key={cat.id} style={{ display: 'grid', gap: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>{cat.name}</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {cat.skills.map(s => {
                        const skillLevel = fighterSkillLevels[f.id]?.[s.id] ?? 0;
                        const checked = !!assigneeSkills[f.id]?.[s.id];
                        const rep = repetitionFactorFromTasks(tasks, { fighterId: f.id, skillId: s.id, difficulty, title });
                        return (
                          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 10, borderRadius: 12, border: '1px solid var(--border-subtle)', background: checked ? 'var(--accent-soft-pill)' : 'var(--surface-panel-alt)', padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => toggleSkill(f.id, s.id, e.target.checked)}
                                style={{ width: 16, height: 16 }}
                              />
                              <span style={{ fontSize: 13 }}>{s.name}</span>
                            </div>
                            {checked ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                  type="number"
                                  value={assigneeSkills[f.id]?.[s.id] ?? 0}
                                  onChange={e => setAssigneeSkills(prev => ({ ...prev, [f.id]: { ...(prev[f.id] ?? {}), [s.id]: Number(e.target.value) || 0 } }))}
                                  style={{ width: 90, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
                                />
                                <span title={`Анти-експлойт: ${rep.count} схожих за ${3} дні`} style={{ fontSize: 11, color: 'var(--muted)' }}>−{Math.round((1 - rep.factor)*100)}%</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--muted)' }}>lvl {skillLevel}</span>
                            )}
                            <div style={{ justifySelf: 'end', fontSize: 12, color: 'var(--muted)' }}>
                              {checked ? `${assigneeSkills[f.id]?.[s.id] ?? 0} XP` : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {fighters.every(f => !selectedFighters[f.id]) && (
              <div style={{ textAlign: 'center', padding: 24, fontSize: 13, color: 'var(--muted)' }}>Додайте хоча б одного виконавця, щоб призначати навички.</div>
            )}
          </div>
        </section>

      </div>
    </Modal>
  );
}
