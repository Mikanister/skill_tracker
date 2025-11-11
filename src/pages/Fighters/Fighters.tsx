import React, { useCallback, useMemo, useState } from 'react';
import { Category, Fighter, FighterSkillLevels, TaskV2, TaskV2Status } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { useFormState } from '@/hooks/useFormState';
import { FightersHeader } from './components/FightersHeader';
import { FighterCard } from './components/FighterCard';
import { CreateFighterModal } from './components/CreateFighterModal';
import { FighterProfileModal } from './components/FighterProfileModal';

type LevelValue = 0|1|2|3|4|5|6|7|8|9|10;

const TASK_STATUS_LABELS: Record<TaskV2Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  validation: 'Validation',
  done: 'Done',
  archived: 'Archived'
};

const formatDateTime = (value?: number) => (value ? new Date(value).toLocaleString() : '—');

const UA_RANK_SUGGESTIONS = [
  'Рекрут', 'Солдат', 'Старший солдат',
  'Молодший сержант', 'Сержант', 'Старший сержант', 'Головний сержант',
  'Штаб-сержант', 'Головний штаб-сержант', 'Майстер-сержант', 'Головний майстер-сержант', 'Штаб-старшина',
  'Молодший лейтенант', 'Лейтенант', 'Старший лейтенант', 'Капітан',
  'Майор', 'Підполковник', 'Полковник',
  'Бригадний генерал', 'Генерал-майор', 'Генерал-лейтенант', 'Генерал'
];

type Props = {
  fighters: Fighter[];
  categories: Category[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  xpLedger: Record<string, Record<string, number>>;
  addFighter: (name: string, initialLevels: FighterSkillLevels, meta?: Partial<Fighter>) => void;
  tasks: TaskV2[];
  deleteFighter: (fighterId: string) => void;
};

export default function Fighters({ fighters, categories, fighterSkillLevels, xpLedger, addFighter, tasks = [], deleteFighter }: Props) {
  const [selectedFighterId, setSelectedFighterId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [groupByUnit, setGroupByUnit] = useState(false);
  const [createCollapsed, setCreateCollapsed] = useState<Record<string, boolean>>({});
  const [profileCollapsed, setProfileCollapsed] = useState<Record<string, boolean>>({});

  const {
    values: fighterForm,
    setValues: setFighterForm,
    reset: resetFighterForm,
    registerField: registerFighterField,
    errors: fighterFormErrors,
    clearErrors: clearFighterFormErrors,
    validate: validateFighterForm
  } = useFormState({
    fullName: '',
    callsign: '',
    rank: '',
    position: '',
    unit: '',
    notes: ''
  }, {
    fullName: value => (value && value.trim().length > 0 ? null : 'Вкажіть ПІБ'),
    callsign: value => (value && value.trim().length > 0 ? null : 'Вкажіть позивний'),
    rank: value => (value && value.trim().length > 0 ? null : 'Вкажіть звання'),
    position: value => (value && value.trim().length > 0 ? null : 'Вкажіть посаду'),
    unit: value => (value && value.trim().length > 0 ? null : 'Вкажіть підрозділ')
  });

  const [rankSuggestionsVisible, setRankSuggestionsVisible] = useState(false);
  const [levels, setLevels] = useState<FighterSkillLevels>({});
  const [modalSearch, setModalSearch] = useState('');

  const selectedFighter = useMemo(() => fighters.find(f => f.id === selectedFighterId) || null, [fighters, selectedFighterId]);

  const tasksByFighter = useMemo(() => {
    const map = new Map<string, { inProgress: number; validation: number }>();
    for (const task of tasks) {
      for (const assignee of task.assignees) {
        const entry = map.get(assignee.fighterId) || { inProgress: 0, validation: 0 };
        if (task.status === 'in_progress') entry.inProgress += 1;
        if (task.status === 'validation') entry.validation += 1;
        map.set(assignee.fighterId, entry);
      }
    }
    return map;
  }, [tasks]);

  const filteredFighters = useMemo(() => {
    const term = search.trim().toLowerCase();
    const byName = fighters.filter(f =>
      (f.name || '').toLowerCase().includes(term) ||
      (f.callsign || '').toLowerCase().includes(term) ||
      (f.fullName || '').toLowerCase().includes(term)
    );
    const sorted = [...byName].sort((a, b) => (a.callsign || a.name).localeCompare(b.callsign || b.name, 'uk'));
    if (!groupByUnit) return [{ group: null as string | null, items: sorted }];
    const groups = new Map<string | null, Fighter[]>();
    for (const fighter of sorted) {
      const unit = (fighter.unit || 'Без підрозділу').trim();
      if (!groups.has(unit)) groups.set(unit, []);
      groups.get(unit)?.push(fighter);
    }
    return Array.from(groups.entries())
      .sort(([groupA], [groupB]) => (groupA || '').localeCompare(groupB || '', 'uk'))
      .map(([group, items]) => ({ group, items }));
  }, [fighters, search, groupByUnit]);

  const fighterTasks = useMemo(() => {
    if (!selectedFighter) return [] as TaskV2[];
    return tasks.filter(task => task.assignees.some(a => a.fighterId === selectedFighter.id));
  }, [tasks, selectedFighter]);

  const taskStatusSummary = useMemo(() => {
    const summary: Record<TaskV2Status, number> = { todo: 0, in_progress: 0, validation: 0, done: 0, archived: 0 };
    for (const task of fighterTasks) {
      summary[task.status] = (summary[task.status] ?? 0) + 1;
    }
    return summary;
  }, [fighterTasks]);

  const recentTasks = useMemo(() => (
    [...fighterTasks]
      .sort((a, b) => {
        const tsA = a.approvedAt ?? a.submittedAt ?? a.createdAt ?? 0;
        const tsB = b.approvedAt ?? b.submittedAt ?? b.createdAt ?? 0;
        return tsB - tsA;
      })
      .slice(0, 5)
  ), [fighterTasks]);

  const totalXp = useMemo(() => {
    if (!selectedFighter) return 0;
    const ledger = xpLedger[selectedFighter.id] || {};
    return Object.values(ledger).reduce((sum, value) => sum + (value ?? 0), 0);
  }, [selectedFighter, xpLedger]);

  const activeSkillCount = useMemo(() => {
    if (!selectedFighter) return 0;
    const levelsMap = fighterSkillLevels[selectedFighter.id] || {};
    return Object.values(levelsMap).filter(level => (level ?? 0) > 0).length;
  }, [selectedFighter, fighterSkillLevels]);

  const resetCreateModalState = useCallback(() => {
    const init: FighterSkillLevels = {} as FighterSkillLevels;
    for (const category of categories) {
      for (const skill of category.skills) {
        init[skill.id] = 0 as LevelValue;
      }
    }
    setLevels(init);
    resetFighterForm();
    clearFighterFormErrors();
    setModalSearch('');
    setCreateCollapsed({});
    setRankSuggestionsVisible(false);
  }, [categories, clearFighterFormErrors, resetFighterForm]);

  const handleOpenCreateModal = () => {
    resetCreateModalState();
    setCreateOpen(true);
  };

  const handleSelectRank = (rank: string) => {
    setFighterForm({ rank });
    setRankSuggestionsVisible(false);
  };

  const handleCreateFighter = () => {
    if (!validateFighterForm()) return;
    const { fullName, callsign, rank, position, unit, notes } = fighterForm;
    const display = callsign.trim() || fullName.trim();
    addFighter(display, levels, {
      fullName: fullName.trim(),
      callsign: callsign.trim(),
      rank: rank.trim(),
      position: position.trim(),
      unit: unit.trim(),
      notes: notes.trim()
    });
    resetCreateModalState();
    setCreateOpen(false);
  };

  const handleCloseCreateModal = () => {
    setCreateOpen(false);
    resetCreateModalState();
  };

  const handleToggleCreateCategory = (categoryId: string) => {
    setCreateCollapsed(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleToggleProfileCategory = (categoryId: string) => {
    setProfileCollapsed(prev => ({ ...prev, [categoryId]: !(prev[categoryId] ?? true) }));
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 20, padding: 24, background: 'var(--surface-panel-alt)' }}>
      <FightersHeader
        fighterCount={fighters.length}
        search={search}
        onSearchChange={setSearch}
        groupByUnit={groupByUnit}
        onToggleGroup={setGroupByUnit}
        onOpenCreate={handleOpenCreateModal}
      />

      <div style={{ flex: 1 }}>
        {filteredFighters.every(group => group.items.length === 0) ? (
          <EmptyState
            icon="🧍"
            title={fighters.length === 0 ? 'Поки що немає бійців' : 'Не знайдено бійців'}
            description={fighters.length === 0 ? 'Додайте першого бійця, щоб почати відслідковувати навички.' : 'Змініть критерії пошуку або створіть нового бійця.'}
            action={{ label: '+ Додати бійця', onClick: handleOpenCreateModal }}
          />
        ) : (
          <div style={{ display: 'grid', gap: 24 }}>
            {filteredFighters.map(({ group, items }) => (
              <div key={group ?? 'ungrouped'} style={{ display: 'grid', gap: 14 }}>
                {groupByUnit && <h3 style={{ margin: 0, fontSize: 18, color: 'var(--muted)' }}>{group}</h3>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
                  {items.map((fighter: Fighter) => (
                    <FighterCard
                      key={fighter.id}
                      fighter={fighter}
                      categories={categories}
                      fighterSkillLevels={fighterSkillLevels}
                      xpLedger={xpLedger}
                      tasksSummary={tasksByFighter.get(fighter.id) || { inProgress: 0, validation: 0 }}
                      onOpenProfile={(fighterId: string) => {
                        setSelectedFighterId(fighterId);
                        setProfileOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateFighterModal
        open={createOpen}
        categories={categories}
        registerField={registerFighterField}
        errors={fighterFormErrors}
        showRankSuggestions={rankSuggestionsVisible}
        onRankFocus={() => setRankSuggestionsVisible(true)}
        onRankBlur={() => setTimeout(() => setRankSuggestionsVisible(false), 120)}
        onSelectRank={handleSelectRank}
        rankSuggestions={UA_RANK_SUGGESTIONS}
        levels={levels}
        onChangeLevel={(skillId: string, level: LevelValue) => setLevels(prev => ({ ...prev, [skillId]: level }))}
        modalSearch={modalSearch}
        onModalSearchChange={setModalSearch}
        collapsed={createCollapsed}
        onToggleCategory={handleToggleCreateCategory}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateFighter}
      />

      <FighterProfileModal
        open={profileOpen && !!selectedFighter}
        fighter={selectedFighter}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        xpLedger={xpLedger}
        tasks={fighterTasks}
        recentTasks={recentTasks}
        taskStatusSummary={taskStatusSummary}
        activeSkillCount={activeSkillCount}
        totalXp={totalXp}
        taskStatusLabels={TASK_STATUS_LABELS}
        formatDateTime={formatDateTime}
        search={search}
        collapsed={profileCollapsed}
        onToggleCategory={handleToggleProfileCategory}
        onClose={() => setProfileOpen(false)}
        onDelete={() => {
          if (selectedFighter && confirm(`Видалити бійця «${selectedFighter.callsign || selectedFighter.name}»?`)) {
            deleteFighter(selectedFighter.id);
            setProfileOpen(false);
          }
        }}
        onNavigate={(direction: 'next' | 'prev') => {
          if (!selectedFighter) return;
          const idx = fighters.findIndex(f => f.id === selectedFighter.id);
          if (idx === -1) return;
          const nextIdx = direction === 'next'
            ? (idx + 1) % fighters.length
            : (idx - 1 + fighters.length) % fighters.length;
          setSelectedFighterId(fighters[nextIdx]?.id ?? selectedFighter.id);
        }}
        onSearchChange={setSearch}
      />
    </div>
  );
}
