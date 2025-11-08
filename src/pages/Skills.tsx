import React, { useMemo, useState } from 'react';
import { Category, Skill, Fighter, FighterSkillLevels } from '@/types';
import { Modal } from '@/components/Modal';

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

export default function Skills({ categories, fighters, fighterSkillLevels, addSkill, updateSkill, deleteSkill, addCategory, renameCategory, deleteCategory, moveSkillToCategory }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [catEditOpen, setCatEditOpen] = useState(false);
  const [catEditName, setCatEditName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [draggedSkillId, setDraggedSkillId] = useState<string | null>(null);
  const [dropTargetCategoryId, setDropTargetCategoryId] = useState<string | null>(null);

  const selectedCategory = useMemo(() => categories.find(c => c.id === selectedCategoryId), [categories, selectedCategoryId]);

  const filteredSkills = useMemo(() => {
    if (!selectedCategory) return [];
    const term = search.trim().toLowerCase();
    if (!term) return selectedCategory.skills;
    return selectedCategory.skills.filter(s => s.name.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term));
  }, [selectedCategory, search]);

  const skillUsage = useMemo(() => {
    const usage = new Map<string, { count: number; maxLevel: number }>();
    fighters.forEach(f => {
      const levels = fighterSkillLevels[f.id] || {};
      Object.entries(levels).forEach(([skillId, lvl]) => {
        const levelNum = Number(lvl) || 0;
        if (!usage.has(skillId)) usage.set(skillId, { count: 0, maxLevel: 0 });
        if (levelNum > 0) {
          const stats = usage.get(skillId)!;
          stats.count += 1;
          stats.maxLevel = Math.max(stats.maxLevel, levelNum);
        }
      });
    });
    return usage;
  }, [fighters, fighterSkillLevels]);

  function openEdit(skill?: Skill) {
    if (skill) {
      setSelectedSkill(skill);
      setEditName(skill.name);
      setEditDescription(skill.description || '');
    } else {
      setSelectedSkill(null);
      setEditName('');
      setEditDescription('');
    }
    setEditOpen(true);
  }

  function openView(skill: Skill) {
    setSelectedSkill(skill);
    setViewName(skill.name);
    setViewDescription(skill.description || '');
    setViewOpen(true);
  }

  function saveSkill() {
    const name = editName.trim();
    if (!name) return;
    if (selectedSkill) {
      updateSkill({ ...selectedSkill, name, description: editDescription.trim() });
    } else if (selectedCategoryId) {
      addSkill(selectedCategoryId, name);
    }
    setEditOpen(false);
  }

  const selectedSkillStats = useMemo(() => {
    if (!selectedSkill) return null;
    const fighterEntries = fighters
      .map(f => ({
        fighter: f,
        level: Number(fighterSkillLevels[f.id]?.[selectedSkill.id] ?? 0)
      }))
      .filter(entry => entry.level > 0)
      .sort((a, b) => b.level - a.level);
    const total = fighterEntries.reduce((sum, entry) => sum + entry.level, 0);
    const average = fighterEntries.length ? (total / fighterEntries.length).toFixed(1) : '0.0';
    const byUnit = fighterEntries.reduce<Record<string, number>>((acc, entry) => {
      const unit = (entry.fighter.unit || 'Без підрозділу').trim();
      acc[unit] = (acc[unit] ?? 0) + 1;
      return acc;
    }, {});
    return {
      fighters: fighterEntries,
      average,
      count: fighterEntries.length,
      byUnit
    };
  }, [selectedSkill, fighters, fighterSkillLevels]);

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, padding: 12, background: 'var(--surface-panel-alt)' }}>
      <aside style={{ border: '1px solid var(--border-subtle)', padding: 16, display: 'grid', gap: 16, gridTemplateRows: 'auto 1fr auto', background: 'var(--surface-panel)', borderRadius: 14, boxShadow: 'var(--shadow-md)' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Категорії</div>
          <strong style={{ fontSize: 20 }}>Каталог</strong>
        </div>
        <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setSelectedCategoryId(cat.id)}
                onDragOver={(e) => { e.preventDefault(); setDropTargetCategoryId(cat.id); }}
                onDragLeave={() => setDropTargetCategoryId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedSkillId && draggedSkillId !== cat.id) {
                    moveSkillToCategory(draggedSkillId, cat.id);
                  }
                  setDraggedSkillId(null);
                  setDropTargetCategoryId(null);
                }}
                style={{
                  flex: 1,
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: dropTargetCategoryId === cat.id
                    ? 'var(--surface-success-soft)'
                    : cat.id === selectedCategoryId
                      ? 'var(--accent-soft-bg)'
                      : 'var(--surface-panel-alt)',
                  border: dropTargetCategoryId === cat.id ? '1px solid var(--success-soft-border)' : '1px solid var(--border-subtle)',
                  color: 'var(--fg)',
                  fontWeight: cat.id === selectedCategoryId ? 600 : 500,
                  letterSpacing: '0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 24,
                  height: 24,
                  padding: '0 8px',
                  borderRadius: 8,
                  background: 'rgba(59,130,246,0.18)',
                  fontSize: 12,
                  color: 'rgba(191,219,254,0.85)',
                  fontWeight: 600
                }}>{(cat.skills?.length ?? 0)}</span>
                <span style={{ flex: 1 }}>{cat.name}</span>
              </button>
              <button
                onClick={() => { setEditingCategory(cat); setCatEditName(cat.name); setCatEditOpen(true); }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-panel-alt)',
                  color: 'var(--fg)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13
                }}
                aria-label={`Редагувати категорію «${cat.name}»`}
              >✎</button>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setEditingCategory(null); setCatEditName(''); setCatEditOpen(true); }}
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--accent-soft-border)',
            background: 'var(--accent-soft-pill)',
            color: 'var(--fg)',
            fontWeight: 600,
            letterSpacing: '0.03em'
          }}
        >+ Нова категорія</button>
      </aside>

      <section style={{ padding: 0, display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 26 }}>{selectedCategory?.name || 'Каталог навичок'}</h2>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{filteredSkills.length} навичок у категорії</div>
          </div>
          <input
            placeholder="Пошук навички"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }}
          />
          <button
            onClick={() => openEdit()}
            style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--accent-soft-bg)', border: '1px solid var(--accent-soft-border)', color: 'var(--fg)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}
          >+ Додати навичку</button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
          alignContent: 'start',
          paddingBottom: 24
        }}>
          {filteredSkills.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '36px 32px', borderRadius: 20, border: '1px dashed var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--muted)', fontSize: 15, display: 'grid', gap: 12, justifyItems: 'center' }}>
              <strong style={{ fontSize: 18, color: 'var(--fg)' }}>У цій категорії поки немає навичок</strong>
              <span>Додайте першу навичку або скористайтесь пошуком.</span>
              <button
                onClick={() => openEdit()}
                data-testid="empty-add-skill"
                style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--accent-soft-border)', background: 'var(--accent-soft-bg)', color: 'var(--fg)', fontWeight: 600 }}
              >+ Додати навичку</button>
            </div>
          )}
          {filteredSkills.map(skill => {
            const usage = skillUsage.get(skill.id) || { count: 0, maxLevel: 0 };
            return (
              <article
                key={skill.id}
                draggable
                onDragStart={() => setDraggedSkillId(skill.id)}
                onDragEnd={() => { setDraggedSkillId(null); setDropTargetCategoryId(null); }}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 16,
                  padding: 16,
                  background: draggedSkillId === skill.id
                    ? 'var(--surface-accent-lift)'
                    : 'var(--surface-card)',
                  display: 'grid',
                  gap: 10,
                  boxShadow: 'var(--shadow-md)',
                  cursor: 'grab',
                  opacity: draggedSkillId === skill.id ? 0.55 : 1,
                  transition: 'opacity 0.15s ease, transform 0.15s ease'
                }}
                onClick={() => openView(skill)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openView(skill);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong style={{ flex: '1 1 160px', fontSize: 17 }}>{skill.name}</strong>
                </div>
                {skill.description && (
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.45 }}>{skill.description}</div>
                )}
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--muted)' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)' }}>Бійців: {usage.count}</span>
                  {usage.maxLevel > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid var(--surface-accent-pill-border)', background: 'var(--surface-accent-pill)', color: 'var(--fg)' }}>Макс. рівень {usage.maxLevel}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={selectedSkill ? 'Редагувати навичку' : 'Нова навичка'} width={600}>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Назва</span>
            <input value={editName} onChange={e => setEditName(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Опис</span>
            <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={4} style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setEditOpen(false)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)', color: 'var(--fg)' }}>Скасувати</button>
            <button onClick={saveSkill} style={{ padding: '6px 10px', background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', borderRadius: 8, color: 'var(--fg)' }}>Зберегти</button>
          </div>
        </div>
      </Modal>

      <Modal open={viewOpen && !!selectedSkill} onClose={() => setViewOpen(false)} title={`Навичка: ${selectedSkill?.name || ''}`} width={720}
        footer={selectedSkill ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <button
              onClick={() => {
                if (selectedSkill && confirm(`Видалити навичку «${selectedSkill.name}»?`)) {
                  deleteSkill(selectedSkill.id);
                  setViewOpen(false);
                }
              }}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--danger-soft-border)', background: 'var(--danger-soft-bg)', color: 'var(--fg)', fontWeight: 600 }}
            >Видалити</button>
            <button
              onClick={() => {
                if (!selectedSkill) return;
                const name = viewName.trim();
                if (!name) return;
                updateSkill({ ...selectedSkill, name, description: viewDescription.trim() });
                setViewOpen(false);
              }}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--accent-soft-border)', background: 'var(--accent-soft-bg)', color: 'var(--fg)', fontWeight: 600 }}
            >Зберегти</button>
          </div>
        ) : undefined}
      >
        {selectedSkill && (
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Назва</span>
              <input value={viewName} onChange={e => setViewName(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Опис</span>
              <textarea value={viewDescription} onChange={e => setViewDescription(e.target.value)} rows={4} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', resize: 'vertical' }} />
            </label>
            {selectedSkillStats && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Бійців володіє</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedSkillStats.count}</div>
                  </div>
                  <div style={{ flex: '1 1 200px', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Середній рівень</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedSkillStats.average}</div>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: 14 }}>Розподіл за підрозділами</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {Object.entries(selectedSkillStats.byUnit).map(([unit, count]) => (
                      <span key={unit} style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)', fontSize: 12 }}>{unit}: {count}</span>
                    ))}
                    {Object.keys(selectedSkillStats.byUnit).length === 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Поки що немає даних</span>}
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: 14 }}>Бійці</strong>
                  {selectedSkillStats.fighters.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Ніхто не володіє цією навичкою.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6, fontSize: 12 }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>Боєць</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>Підрозділ</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px солід var(--border-subtle)' }}>Рівень</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSkillStats.fighters.map(({ fighter, level }) => (
                          <tr key={fighter.id}>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>{fighter.callsign || fighter.name}</td>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>{fighter.unit || '—'}</td>
                            <td style={{ padding: '6px 8px', borderBottom: '1px солід var(--border-subtle)' }}>lvl {level}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={catEditOpen} onClose={() => setCatEditOpen(false)} title={editingCategory ? 'Редагувати категорію' : 'Нова категорія'} width={500}>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Назва категорії</span>
            <input value={catEditName} onChange={e => setCatEditName(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            {editingCategory && (
              <button
                onClick={() => {
                  if (confirm(`Видалити категорію «${editingCategory.name}»? Всі навички в ній також будуть видалені.`)) {
                    deleteCategory(editingCategory.id);
                    setCatEditOpen(false);
                  }
                }}
                style={{ padding: '6px 10px', background: 'var(--danger-soft-bg)', border: '1px solid var(--danger-soft-border)', borderRadius: 6, color: 'var(--fg)' }}
              >Видалити категорію</button>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={() => setCatEditOpen(false)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)', color: 'var(--fg)' }}>Скасувати</button>
              <button
                onClick={() => {
                  const name = catEditName.trim();
                  if (!name) return;
                  if (editingCategory) {
                    renameCategory(editingCategory.id, name);
                  } else {
                    addCategory(name);
                  }
                  setCatEditOpen(false);
                }}
                style={{ padding: '6px 10px', background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', borderRadius: 6, color: 'var(--fg)' }}
              >Зберегти</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
