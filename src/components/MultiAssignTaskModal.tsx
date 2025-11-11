import React from 'react';
import clsx from 'clsx';
import { Category, Fighter, FighterSkillLevels, TaskV2, TaskV2Assignee } from '@/types';
import { Modal } from './Modal';
import { repetitionFactorFromTasks } from '@/utils';
import { useMultiAssignForm } from '@/hooks/useMultiAssignForm';

type Props = {
  open: boolean;
  onClose: () => void;
  fighters: Fighter[];
  categories: Category[];
  tasks?: TaskV2[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  onCreate: (payload: { title: string; description?: string; difficulty: 1|2|3|4|5; assignees: TaskV2Assignee[]; isPriority?: boolean }) => void;
};

export default function MultiAssignTaskModal({ open, onClose, fighters, categories, tasks = [], fighterSkillLevels, onCreate }: Props) {
  const {
    title,
    description,
    difficulty,
    isPriority,
    search,
    error,
    selectedFighters,
    assigneeSkills,
    filteredFighters,
    selectedFighterList,
    setTitle,
    setDescription,
    setDifficulty,
    setIsPriority,
    setSearch,
    toggleFighter,
    toggleSkill,
    setSkillXp,
    submit,
    reset,
    clearError
  } = useMultiAssignForm({
    fighters,
    categories,
    tasks,
    fighterSkillLevels,
    defaultDifficulty: 3
  });

  const handleSubmit = () => {
    const payload = submit();
    if (!payload) return;
    onCreate(payload);
    reset();
    onClose();
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  const disableSubmit = title.trim().length === 0;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Нова задача (кілька виконавців)"
      width={820}
      footer={(
        <div className="modal-footer-actions">
          <button
            onClick={handleClose}
            className="btn-panel"
          >Скасувати</button>
          <button
            onClick={handleSubmit}
            disabled={disableSubmit}
            className="btn-success-soft"
          >
            Створити задачу
          </button>
        </div>
      )}
    >
      <div className="multiassign-grid">
        <div className="multiassign-row">
          <label className="labeled-field text-sm text-muted">
            <span className="text-strong">Назва</span>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Вкажіть назву" className="input-control" />
          </label>
          <label className="labeled-field text-sm text-muted">
            <span className="text-strong">Складність</span>
            <select value={difficulty} onChange={e => {
              const nextDifficulty = Number(e.target.value) as 1|2|3|4|5;
              setDifficulty(nextDifficulty);
            }} className="input-control">
              {[1,2,3,4,5].map(n => (<option key={n} value={n}>{n}</option>))}
            </select>
          </label>
        </div>
        <label className="multiassign-inline text-sm" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={isPriority} onChange={e => setIsPriority(e.target.checked)} />
          <span style={{ fontWeight: 600 }}>Пріоритетно</span>
        </label>
        <label className="labeled-field text-sm text-muted">
          <span className="text-strong">Опис</span>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Додайте короткий опис" className="textarea-control" />
        </label>
        {error && <div className="alert-danger-soft">{error}</div>}
        <section className="multiassign-section">
          <div className="skills-header">
            <strong className="text-md text-strong" style={{ flex: 1 }}>Виконавці</strong>
            <input placeholder="Пошук бійця" value={search} onChange={e => setSearch(e.target.value)} className="search-input" style={{ width: 220 }} />
          </div>
          <div className="multiassign-assignee-list">
            {filteredFighters.length === 0 ? (
              <span className="text-sm text-muted" style={{ fontStyle: 'italic' }}>Бійців не знайдено</span>
            ) : (
              filteredFighters.map(f => (
                <label key={f.id} className={clsx('multiassign-assignee-item', { 'is-selected': selectedFighters[f.id] })}>
                  <input type="checkbox" checked={!!selectedFighters[f.id]} onChange={e => toggleFighter(f.id, e.target.checked)} />
                  <span className="text-sm text-strong">{f.callsign || f.fullName || f.name}</span>
                </label>
              ))
            )}
          </div>
        </section>

        <section className="multiassign-section">
          <strong className="text-md text-strong">Скіли та XP по кожному бійцю</strong>
          <div className="multiassign-skills-board">
            {selectedFighterList.map(f => (
              <div key={f.id} className="multiassign-card">
                <div className="multiassign-card-header">
                  <div className="text-md text-strong">{f.callsign || f.fullName || f.name}</div>
                  <div className="multiassign-card-count">{Object.keys(assigneeSkills[f.id] ?? {}).length} навичок</div>
                </div>
                {categories.map(cat => (
                  <div key={cat.id} className="multiassign-category">
                    <div className="multiassign-category-title">{cat.name}</div>
                    <div className="multiassign-skill-list">
                      {cat.skills.map(s => {
                        const skillLevel = fighterSkillLevels[f.id]?.[s.id] ?? 0;
                        const checked = !!assigneeSkills[f.id]?.[s.id];
                        const rep = repetitionFactorFromTasks(tasks, { fighterId: f.id, skillId: s.id, difficulty, title });
                        return (
                          <div key={s.id} className={clsx('multiassign-skill-line', { 'is-selected': checked })}>
                            <div className="multiassign-skill-title">
                              <input
                                type="checkbox"
                                aria-label={s.name}
                                checked={checked}
                                onChange={e => toggleSkill(f.id, s.id, e.target.checked)}
                              />
                              <span className="text-sm text-strong">{s.name}</span>
                            </div>
                            {checked ? (
                              <div className="multiassign-skill-controls">
                                <input
                                  type="number"
                                  value={assigneeSkills[f.id]?.[s.id] ?? 0}
                                  onChange={e => setSkillXp(f.id, s.id, Number(e.target.value))}
                                  className="input-number-sm"
                                />
                                <span title={`Анти-експлойт: ${rep.count} схожих за ${3} дні`} className="text-xs text-muted">−{Math.round((1 - rep.factor)*100)}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted">lvl {skillLevel}</span>
                            )}
                            <div className="text-xs text-muted" style={{ justifySelf: 'end' }}>
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
              <div className="empty-hint">Додайте хоча б одного виконавця, щоб призначати навички.</div>
            )}
          </div>
        </section>

      </div>
    </Modal>
  );
}
