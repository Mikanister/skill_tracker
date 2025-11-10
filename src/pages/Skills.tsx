import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Category, Skill, Fighter, FighterSkillLevels } from '@/types';
import { Modal } from '@/components/Modal';
import { buildSkillUsage, calculateSkillStats } from '@/utils/skills';
import { useFormState } from '@/hooks/useFormState';
import { useModalState } from '@/hooks/useModalState';

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
  const [search, setSearch] = useState('');
  const [catEditOpen, setCatEditOpen] = useState(false);
  const [catEditName, setCatEditName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [draggedSkillId, setDraggedSkillId] = useState<string | null>(null);
  const [dropTargetCategoryId, setDropTargetCategoryId] = useState<string | null>(null);

  const {
    isOpen: isEditOpen,
    data: editSkill,
    open: openEditModal,
    close: closeEditModal,
    setData: setEditModalData
  } = useModalState<Skill | null>(false, null);

  const {
    isOpen: isViewOpen,
    data: viewSkill,
    open: openViewModal,
    close: closeViewModal,
    setData: setViewModalData
  } = useModalState<Skill | null>(false, null);

  const {
    values: editValues,
    setValues: setEditValues,
    reset: resetEditForm,
    registerField: registerEditField,
    validate: validateEditForm,
    errors: editErrors,
    clearErrors: clearEditErrors
  } = useFormState({ name: '', description: '' }, {
    name: value => (typeof value === 'string' && value.trim().length > 0 ? null : 'Вкажіть назву навички.')
  });

  const {
    values: viewValues,
    setValues: setViewValues,
    reset: resetViewForm,
    registerField: registerViewField,
    validate: validateViewForm,
    errors: viewErrors,
    clearErrors: clearViewErrors
  } = useFormState({ name: '', description: '' }, {
    name: value => (typeof value === 'string' && value.trim().length > 0 ? null : 'Вкажіть назву навички.')
  });

  const selectedCategory = useMemo(() => categories.find(c => c.id === selectedCategoryId), [categories, selectedCategoryId]);

  const filteredSkills = useMemo(() => {
    if (!selectedCategory) return [];
    const term = search.trim().toLowerCase();
    if (!term) return selectedCategory.skills;
    return selectedCategory.skills.filter(s => s.name.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term));
  }, [selectedCategory, search]);

  const skillUsage = useMemo(() => buildSkillUsage(fighters, fighterSkillLevels), [fighters, fighterSkillLevels]);

  function openEdit(skill?: Skill) {
    clearEditErrors();
    if (skill) {
      openEditModal(skill);
      setEditValues({ name: skill.name, description: skill.description || '' });
    } else {
      openEditModal(null);
      resetEditForm({ name: '', description: '' });
    }
  }

  function openView(skill: Skill) {
    clearViewErrors();
    openViewModal(skill);
    setViewValues({ name: skill.name, description: skill.description || '' });
  }

  function saveSkill() {
    if (!validateEditForm()) return;
    const name = editValues.name.trim();
    if (editSkill) {
      updateSkill({ ...editSkill, name, description: editValues.description.trim() });
    } else if (selectedCategoryId) {
      addSkill(selectedCategoryId, name);
    }
    resetEditForm({ name: '', description: '' });
    setEditModalData(() => null);
    closeEditModal();
  }

  const selectedSkillStats = useMemo(() => viewSkill ? calculateSkillStats(viewSkill.id, fighters, fighterSkillLevels) : null, [viewSkill, fighters, fighterSkillLevels]);

  return (
    <div className="skills-layout">
      <aside className="skills-sidebar">
        <div className="skills-sidebar-header">
          <div className="text-xs text-muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Категорії</div>
          <strong className="text-md text-strong">Каталог</strong>
        </div>
        <div className="skills-category-list">
          {categories.map(cat => (
            <div key={cat.id} className="skills-category-item">
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
                className={clsx(
                  'skills-category-btn',
                  {
                    'is-selected': cat.id === selectedCategoryId,
                    'is-drop-target': dropTargetCategoryId === cat.id
                  }
                )}
              >
                <span className="skills-category-count">{(cat.skills?.length ?? 0)}</span>
                <span style={{ flex: 1 }}>{cat.name}</span>
              </button>
              <button
                onClick={() => { setEditingCategory(cat); setCatEditName(cat.name); setCatEditOpen(true); }}
                className="icon-button"
                aria-label={`Редагувати категорію «${cat.name}»`}
              >✎</button>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setEditingCategory(null); setCatEditName(''); setCatEditOpen(true); }}
          className="btn-accent-pill"
        >+ Нова категорія</button>
      </aside>

      <section className="skills-content">
        <div className="skills-header">
          <div className="skills-header-title">
            <h2 className="text-xl text-strong" style={{ margin: 0 }}>{selectedCategory?.name || 'Каталог навичок'}</h2>
            <div className="skills-header-meta">{filteredSkills.length} навичок у категорії</div>
          </div>
          <input
            placeholder="Пошук навички"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input skills-search"
          />
          <button
            onClick={() => openEdit()}
            className="btn-primary"
          >+ Додати навичку</button>
        </div>

        <div className="skills-grid">
          {filteredSkills.length === 0 && (
            <div className="skills-empty-card">
              <strong className="skills-empty-title">У цій категорії поки немає навичок</strong>
              <span>Додайте першу навичку або скористайтесь пошуком.</span>
              <button
                onClick={() => openEdit()}
                data-testid="empty-add-skill"
                className="btn-primary"
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
                className={clsx('skill-card', { 'is-dragging': draggedSkillId === skill.id })}
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
                <div className="flex-row align-center gap-12" style={{ flexWrap: 'wrap' }}>
                  <strong className="skill-card-title">{skill.name}</strong>
                </div>
                {skill.description && (
                  <div className="skill-card-description">{skill.description}</div>
                )}
                <div className="flex-row gap-8" style={{ fontSize: 11, color: 'var(--muted)' }}>
                  <span className="chip">Бійців: {usage.count}</span>
                  {usage.maxLevel > 0 && (
                    <span className="chip chip--accent">Макс. рівень {usage.maxLevel}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Modal
        open={isEditOpen}
        onClose={() => {
          closeEditModal();
          setEditModalData(() => null);
          clearEditErrors();
        }}
        title={editSkill ? 'Редагувати навичку' : 'Нова навичка'}
        width={600}
      >
        <div className="skills-modal-grid">
          <label className="labeled-field">
            <span>Назва</span>
            <input {...registerEditField('name')} className="input-control" />
            {editErrors.name && <span className="text-xs text-muted" style={{ color: 'var(--danger)' }}>{editErrors.name}</span>}
          </label>
          <label className="labeled-field">
            <span>Опис</span>
            <textarea {...registerEditField('description')} rows={4} className="textarea-control" />
          </label>
          <div className="skills-modal-actions">
            <button
              onClick={() => {
                closeEditModal();
                setEditModalData(() => null);
              }}
              className="btn-panel"
            >Скасувати</button>
            <button onClick={saveSkill} className="btn-primary-soft">Зберегти</button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isViewOpen && !!viewSkill}
        onClose={() => {
          closeViewModal();
          setViewModalData(() => null);
          clearViewErrors();
        }}
        title={`Навичка: ${viewValues.name || viewSkill?.name || ''}`}
        width={720}
        footer={viewSkill ? (
          <div className="skills-modal-footer">
            <button
              onClick={() => {
                if (viewSkill && confirm(`Видалити навичку «${viewSkill.name}»?`)) {
                  deleteSkill(viewSkill.id);
                  closeViewModal();
                  setViewModalData(() => null);
                }
              }}
              className="btn-danger-soft"
            >Видалити</button>
            <button
              onClick={() => {
                if (!viewSkill) return;
                if (!validateViewForm()) return;
                const name = viewValues.name.trim();
                updateSkill({ ...viewSkill, name, description: viewValues.description.trim() });
                closeViewModal();
                setViewModalData(() => null);
              }}
              className="btn-primary"
            >Зберегти</button>
          </div>
        ) : undefined}
      >
        {viewSkill && (
          <div className="skills-modal-grid">
            <label className="labeled-field">
              <span className="text-xs text-muted">Назва</span>
              <input {...registerViewField('name')} className="input-control" />
              {viewErrors.name && <span className="text-xs text-muted" style={{ color: 'var(--danger)' }}>{viewErrors.name}</span>}
            </label>
            <label className="labeled-field">
              <span className="text-xs text-muted">Опис</span>
              <textarea {...registerViewField('description')} rows={4} className="textarea-control" />
            </label>
            {selectedSkillStats && (
              <div className="modal-stack">
                <div className="skills-stats-cards">
                  <div className="skills-stats-card">
                    <div className="text-xs text-muted">Бійців володіє</div>
                    <div className="text-lg text-strong">{selectedSkillStats.count}</div>
                  </div>
                  <div className="skills-stats-card">
                    <div className="text-xs text-muted">Середній рівень</div>
                    <div className="text-lg text-strong">{selectedSkillStats.average}</div>
                  </div>
                </div>
                <div>
                  <strong className="section-title">Розподіл за підрозділами</strong>
                  <div className="skills-distribution">
                    {(Object.entries(selectedSkillStats.byUnit) as Array<[string, number]>).map(([unit, count]) => (
                      <span key={unit} className="chip">{unit}: {count}</span>
                    ))}
                    {Object.keys(selectedSkillStats.byUnit).length === 0 && <span className="text-xs text-muted">Поки що немає даних</span>}
                  </div>
                </div>
                <div>
                  <strong className="section-title">Бійці</strong>
                  {selectedSkillStats.fighters.length === 0 ? (
                    <div className="text-xs text-muted" style={{ marginTop: 6 }}>Ніхто не володіє цією навичкою.</div>
                  ) : (
                    <table className="table-muted">
                      <thead>
                        <tr>
                          <th>Боєць</th>
                          <th>Підрозділ</th>
                          <th>Рівень</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSkillStats.fighters.map(({ fighter, level }: { fighter: Fighter; level: number }) => (
                          <tr key={fighter.id}>
                            <td>{fighter.callsign || fighter.name}</td>
                            <td>{fighter.unit || '—'}</td>
                            <td>lvl {level}</td>
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
        <div className="skills-modal-grid">
          <label className="labeled-field">
            <span>Назва категорії</span>
            <input value={catEditName} onChange={e => setCatEditName(e.target.value)} className="input-control" />
          </label>
          <div className="skills-modal-footer">
            {editingCategory && (
              <button
                onClick={() => {
                  if (confirm(`Видалити категорію «${editingCategory.name}»? Всі навички в ній також будуть видалені.`)) {
                    deleteCategory(editingCategory.id);
                    setCatEditOpen(false);
                  }
                }}
                className="btn-danger-soft"
              >Видалити категорію</button>
            )}
            <div className="danger-actions">
              <button onClick={() => setCatEditOpen(false)} className="btn-panel">Скасувати</button>
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
                className="btn-primary-soft"
              >Зберегти</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
