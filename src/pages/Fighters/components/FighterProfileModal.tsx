import React from 'react';
import { Category, Fighter, FighterSkillLevels, TaskV2, TaskV2Status } from '@/types';
import { Modal } from '@/components/Modal';
import { SkillProgress } from '@/components/SkillProgress';

type FighterProfileModalProps = {
  open: boolean;
  fighter: Fighter | null;
  categories: Category[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  xpLedger: Record<string, Record<string, number>>;
  tasks: TaskV2[];
  recentTasks: TaskV2[];
  taskStatusSummary: Record<TaskV2Status, number>;
  activeSkillCount: number;
  totalXp: number;
  taskStatusLabels: Record<TaskV2Status, string>;
  formatDateTime: (value?: number) => string;
  search: string;
  collapsed: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  onClose: () => void;
  onDelete: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onSearchChange: (value: string) => void;
};

const ACCENT_CYCLE: Array<'blue' | 'teal' | 'violet'> = ['blue', 'teal', 'violet'];

export const FighterProfileModal: React.FC<FighterProfileModalProps> = ({
  open,
  fighter,
  categories,
  fighterSkillLevels,
  xpLedger,
  tasks,
  recentTasks,
  taskStatusSummary,
  activeSkillCount,
  totalXp,
  taskStatusLabels,
  formatDateTime,
  search,
  collapsed,
  onToggleCategory,
  onClose,
  onDelete,
  onNavigate,
  onSearchChange
}) => {
  if (!fighter) {
    return null;
  }

  const levelsMap = fighterSkillLevels[fighter.id] || {};
  const ledger = xpLedger[fighter.id] || {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Профіль: ${fighter.callsign || fighter.name || ''}`}
      width={960}
      footer={null}
    >
      <div className="stack gap-18">
        <div className="fighter-profile-toolbar">
          <div className="fighter-profile-nav">
            <button onClick={() => onNavigate('prev')} className="btn-panel">← Попередній</button>
            <button onClick={() => onNavigate('next')} className="btn-panel">Наступний →</button>
          </div>
          <input
            placeholder="Пошук скіла"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            className="input-pill input-pill--fluid"
          />
          <button onClick={onDelete} className="btn-danger-soft">Видалити</button>
        </div>

        <div className="fighter-summary-grid">
          <div className="surface-card-block surface-card-block--tight">
            <strong className="section-title">Загальна інформація</strong>
            <span className="text-sm text-muted">ПІБ:</span>
            <span className="text-md text-strong">{fighter.fullName || fighter.name}</span>
            {(fighter.rank || fighter.position) && (
              <span className="text-sm text-muted">
                {[fighter.rank, fighter.position].filter(Boolean).join(' • ')}
              </span>
            )}
            {fighter.unit && <span className="text-sm text-muted">Підрозділ: {fighter.unit}</span>}
            {fighter.notes && (
              <div className="text-xs text-muted" style={{ lineHeight: 1.4 }}>
                <span className="text-strong">Нотатки:</span>
                <div>{fighter.notes}</div>
              </div>
            )}
          </div>
          <div className="surface-card-block">
            <strong className="section-title">Зведення</strong>
            <span className="text-sm text-muted">Активні скіли: <strong className="text-strong">{activeSkillCount}</strong></span>
            <span className="text-sm text-muted">Накопичено XP: <strong className="text-strong">{totalXp}</strong></span>
            <div className="stack gap-6">
              {(Object.keys(taskStatusLabels) as TaskV2Status[]).map(status => (
                <div key={status} className="row-between text-xs text-muted">
                  <span>{taskStatusLabels[status]}</span>
                  <strong className="text-strong">{taskStatusSummary[status] ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="surface-card-block">
            <strong className="section-title">Останні задачі</strong>
            {recentTasks.length === 0 ? (
              <span className="text-xs text-muted">Немає історії задач.</span>
            ) : (
              recentTasks.map(task => (
                <div key={task.id} className="task-history-item">
                  <div className="row-between text-xs">
                    <span className="text-strong">#{task.taskNumber ?? '—'} · {task.title}</span>
                    <span className="text-muted">{taskStatusLabels[task.status]}</span>
                  </div>
                  <span className="text-xs text-muted">{formatDateTime(task.approvedAt ?? task.submittedAt ?? task.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {categories.map((category, catIndex) => {
          const isCollapsed = collapsed[category.id] ?? false;
          return (
            <div key={category.id} className="surface-panel-block">
              <div className="flex-row align-center gap-8">
                <strong className="text-md text-strong">{category.name}</strong>
                <button
                  onClick={() => onToggleCategory(category.id)}
                  className="btn-panel btn-panel--alt"
                >
                  {isCollapsed ? 'Розгорнути' : 'Згорнути'}
                </button>
              </div>
              {!isCollapsed && (
                <div className="stack gap-12 mt-1">
                  {category.skills.map((skill, skillIndex) => {
                    const level = (levelsMap[skill.id] ?? 0) as 0|1|2|3|4|5|6|7|8|9|10;
                    const xp = (ledger[skill.id] ?? 0) as number;
                    const assigned = level > 0 || xp > 0;
                    const accent = ACCENT_CYCLE[(catIndex + skillIndex) % ACCENT_CYCLE.length];
                    return (
                      <SkillProgress
                        key={skill.id}
                        name={skill.name}
                        level={level}
                        xp={xp}
                        accent={accent}
                        disabled={!assigned}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
