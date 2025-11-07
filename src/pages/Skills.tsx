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
  const [statsOpen, setStatsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
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

  function openStats(skill: Skill) {
    setSelectedSkill(skill);
    setStatsOpen(true);
  }

  const skillStats = useMemo(() => {
    if (!selectedSkill) return null;
    const fightersWithSkill = fighters.filter(f => (fighterSkillLevels[f.id]?.[selectedSkill.id] ?? 0) > 0);
    const levels = fightersWithSkill.map(f => Number(fighterSkillLevels[f.id]?.[selectedSkill.id] ?? 0));
    const avgLevel = levels.length ? (levels.reduce((sum, lvl) => sum + lvl, 0) / levels.length).toFixed(1) : '0.0';
    const topFighters = fightersWithSkill
      .map(f => ({ fighter: f, level: fighterSkillLevels[f.id]?.[selectedSkill.id] ?? 0 }))
      .sort((a, b) => b.level - a.level)
      .slice(0, 3);
    return { count: fightersWithSkill.length, avgLevel, topFighters };
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
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  background: 'rgba(59,130,246,0.25)',
                  fontSize: 12,
                  color: 'rgba(191,219,254,0.85)'
                }}>{(cat.skills?.length ?? 0)}</span>
                <span style={{ flex: 1 }}>{cat.name}</span>
              </button>
              <button
                onClick={() => { setEditingCategory(cat); setCatEditName(cat.name); setCatEditOpen(true); }}
                style={{
                  padding: '6px 8px',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-panel-alt)',
                  color: 'var(--fg)'
                }}
              >✏️</button>
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
            <div style={{ gridColumn: '1 / -1', padding: '24px 28px', borderRadius: 18, border: '1px dashed var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--muted)', fontSize: 14 }}>
              Навичок не знайдено. Спробуйте інший запит або додайте нову.
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
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <strong style={{ flex: 1, fontSize: 17 }}>{skill.name}</strong>
                  {usage.maxLevel > 0 && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-accent-pill)', border: '1px solid var(--surface-accent-pill-border)', color: 'var(--fg)' }}>max lvl {usage.maxLevel}</span>
                  )}
                </div>
                {skill.description && (
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.45 }}>{skill.description}</div>
                )}
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                  <span>⚔️ Бійців: {usage.count}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={() => openStats(skill)} style={{ padding: '8px 12px', flex: 1, borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)', color: 'var(--fg)', fontWeight: 600 }}>Статистика</button>
                  <button onClick={() => openEdit(skill)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--accent-soft-border)', background: 'var(--accent-soft-pill)', color: 'var(--fg)', fontWeight: 600 }}>Редагувати</button>
                  <button
                    onClick={() => { if (confirm(`Видалити навичку «${skill.name}»?`)) deleteSkill(skill.id); }}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--danger-soft-border)', background: 'var(--danger-soft-bg)', color: 'var(--fg)', fontWeight: 600 }}
                  >Видалити</button>
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

      <Modal open={statsOpen} onClose={() => setStatsOpen(false)} title={`Статистика: ${selectedSkill?.name || ''}`} width={700}>
        {skillStats && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--surface-panel)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Бійців володіє</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{skillStats.count}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Середній рівень</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{skillStats.avgLevel}</div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Топ-3 бійці</div>
              {skillStats.topFighters.length === 0 && <div style={{ color: 'var(--muted)' }}>Ніхто не володіє</div>}
              {skillStats.topFighters.map(({ fighter, level }) => (
                <div key={fighter.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 6, border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'var(--surface-card)' }}>
                  <span style={{ flex: 1 }}>{fighter.callsign || fighter.name}</span>
                  <span style={{ fontSize: 12, padding: '2px 8px', border: '1px solid var(--border-subtle)', borderRadius: 999, background: 'var(--surface-panel)' }}>lvl {level}</span>
                </div>
              ))}
            </div>
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
