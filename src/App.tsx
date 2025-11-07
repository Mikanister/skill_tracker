import React from 'react';
import { CategoryList } from '@/components/CategoryList';
import { SkillDetail } from '@/components/SkillDetail';
import { SkillList } from '@/components/SkillList';
import { useSkillRpgState } from '@/state';
import { getCategoryProgress } from '@/utils';
import { FighterManager } from '@/components/FighterManager';
import { TaskBoard } from '@/components/TaskBoard';
import { Modal } from '@/components/Modal';
import { FighterSkills } from '@/types';

export default function App() {
  const {
    tree,
    profile,
    profiles,
    mode,
    setMode,
    fighters,
    setFighters,
    addFighter,
    selectedFighterId,
    setSelectedFighterId,
    tasks,
    setTasks,
    setXpLedger,
    fighterSkills,
    setFighterSkills,
    fighterSkillLevels,
    setFighterSkillLevels,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSkillId,
    setSelectedSkillId,
    selectedCategory,
    selectedSkill,
    onResetToSeed,
    addSkill,
    updateSkill,
    deleteSkill,
    switchProfile
  } = useSkillRpgState();
  const [theme, setTheme] = React.useState<string>(() => localStorage.getItem('skillrpg_theme') || 'light');
  const [search, setSearch] = React.useState('');
  const [showArchived, setShowArchived] = React.useState(false);
  const [topView, setTopView] = React.useState<'skills'|'tasks'|'fighters'>('skills');
  const [helpOpen, setHelpOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('skillrpg_theme', theme);
  }, [theme]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid #eee' }}>
        <strong>SkillRPG (UA)</strong>
        <span style={{ color: '#666' }}>Локальний трекер навичок</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setTopView('skills')} style={{ padding: '6px 10px', fontWeight: topView==='skills'?'700':'400' }}>Навички</button>
          <button onClick={() => setTopView('tasks')} style={{ padding: '6px 10px', fontWeight: topView==='tasks'?'700':'400' }}>Задачі</button>
          <button onClick={() => setTopView('fighters')} style={{ padding: '6px 10px', fontWeight: topView==='fighters'?'700':'400' }}>Бійці</button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#666' }}>Профіль</label>
            <select value={profile} onChange={e => switchProfile(e.target.value)} style={{ padding: '6px 8px' }}>
              {profiles.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const name = prompt('Назва профілю');
                if (!name) return;
                switchProfile(name.trim());
              }}
              style={{ padding: '6px 10px' }}
            >
              + Профіль
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#666' }}>Боєць</label>
            <select
              value={selectedFighterId ?? ''}
              onChange={e => setSelectedFighterId(e.target.value || null)}
              style={{ padding: '6px 8px', minWidth: 160 }}
            >
              <option value="">— не вибрано —</option>
              {fighters.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {selectedFighterId && (
              <button onClick={() => setSelectedFighterId(null)} style={{ padding: '6px 10px' }}>Очистити</button>
            )}
          </div>
          <button onClick={() => setMode(mode === 'view' ? 'edit' : 'view')} style={{ padding: '6px 10px' }}>
            {mode === 'view' ? 'Режим редагування' : 'Режим перегляду'}
          </button>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} style={{ padding: '6px 10px' }}>
            {theme === 'light' ? 'Темна тема' : 'Світла тема'}
          </button>
          <button onClick={() => setHelpOpen(true)} style={{ padding: '6px 10px' }}>Довідка</button>
          <button onClick={onResetToSeed} style={{ padding: '6px 10px', background: '#fff3cd', border: '1px solid #ffe69c', borderRadius: 6 }}>
            Скинути до seed
          </button>
          <button
            onClick={() => {
              if (!confirm('Очистити локальні дані бійців/задач/XP?')) return;
              try {
                localStorage.removeItem('skillrpg_fighters');
                localStorage.removeItem('skillrpg_tasks');
                localStorage.removeItem('skillrpg_xp');
                localStorage.removeItem('skillrpg_fighter_skills');
                localStorage.removeItem('skillrpg_fighter_skill_levels');
              } catch {}
              setFighters([]);
              setSelectedFighterId(null);
              setTasks([]);
              setXpLedger({});
              setFighterSkills({});
              setFighterSkillLevels({});
            }}
            style={{ padding: '6px 10px', background: '#ffecec', border: '1px solid #f5c2c7', borderRadius: 6 }}
          >
            Очистити локальні дані
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify(tree, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'skillrpg_ua_backup.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ padding: '6px 10px' }}
          >
            Експорт JSON
          </button>
          <label className="no-print" style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>
            Імпорт JSON
            <input
              type="file"
              accept="application/json"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                try {
                  const parsed = JSON.parse(text);
                  // naive replace: best-effort
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (window as any).dispatchEvent(new CustomEvent('skillrpg_import', { detail: parsed }));
                } catch {
                  alert('Некоректний JSON');
                }
              }}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={() => window.print()} style={{ padding: '6px 10px' }}>Друк</button>
        </div>
      </header>
      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: topView==='skills' ? (selectedSkill ? '280px 320px 1fr' : '280px 1fr') : '1fr', minHeight: 0 }}>
        {topView==='skills' && (
        <section style={{ borderRight: '1px solid #eee', minWidth: 0 }}>
          <CategoryList
            categories={tree.categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={id => {
              setSelectedCategoryId(id);
              setSelectedSkillId(null);
            }}
          />
          <div style={{ padding: 12, borderTop: '1px solid #eee' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Прогрес категорій</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
              {tree.categories.map(c => {
                const p = getCategoryProgress(c);
                return (
                  <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{c.name}</span>
                    <span>{p.pct}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
        )}
        {topView==='skills' && (
        <section style={{ borderRight: '1px solid #eee', minWidth: 0 }}>
          <div style={{ padding: 12, display: 'flex', gap: 6 }}>
            <input
              placeholder="Пошук (назва або тег)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: 8, border: '1px solid #dcdcdc', borderRadius: 6 }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
              Архів
            </label>
          </div>
          <SkillList
            category={selectedCategory}
            selectedSkillId={selectedSkillId}
            onSelect={setSelectedSkillId}
            onCreateSkill={(name) => {
              if (!selectedCategoryId) return;
              addSkill(selectedCategoryId, name);
            }}
            showArchived={showArchived}
            search={search}
          />
        </section>
        )}
        {topView==='skills' && selectedSkill && (
          <section style={{ minWidth: 0 }}>
            <SkillDetail
              skill={selectedSkill}
              mode={mode}
              onChange={updateSkill}
              onDelete={deleteSkill}
              selectedFighterId={selectedFighterId}
              fighterSkills={fighterSkills}
              fighterSkillLevels={fighterSkillLevels}
              onToggleSkill={(fighterId, skillId, assigned) =>
                setFighterSkills((prev: Record<string, FighterSkills>) => ({
                  ...prev,
                  [fighterId]: { ...(prev[fighterId] ?? {}), [skillId]: assigned }
                }))}
              onSetLevel={(fighterId, skillId, level) =>
                setFighterSkillLevels(prev => ({
                  ...prev,
                  [fighterId]: { ...(prev[fighterId] ?? {}), [skillId]: level }
                }))}
            />
          </section>
        )}
        {topView==='fighters' && (
          <section>
            <FighterManager
              fighters={fighters}
              selectedFighterId={selectedFighterId}
              onSelect={setSelectedFighterId}
              onAdd={(name, initialLevels) => addFighter(name, initialLevels)}
              categories={tree.categories}
              fighterSkills={fighterSkills}
              fighterSkillLevels={fighterSkillLevels}
              onToggleSkill={(fighterId, skillId, assigned) =>
                setFighterSkills((prev: Record<string, FighterSkills>) => ({
                  ...prev,
                  [fighterId]: { ...(prev[fighterId] ?? {}), [skillId]: assigned }
                }))}
              onSetLevel={(fighterId, skillId, level) =>
                setFighterSkillLevels(prev => ({
                  ...prev,
                  [fighterId]: { ...(prev[fighterId] ?? {}), [skillId]: level }
                }))}
            />
          </section>
        )}
        {topView==='tasks' && (
          <section>
            <TaskBoard
              fighters={fighters}
              selectedFighterId={selectedFighterId}
              onSelectFighter={setSelectedFighterId}
              categories={tree.categories}
              tasks={tasks}
              fighterSkills={fighterSkills}
              onCreateTask={({ title, description, difficulty, links }) => {
                if (!selectedFighterId) return;
                const relatedSkills = links.map(l => ({ skillId: l.skillId, categoryId: l.categoryId }));
                const suggestedXp: Record<string, number> = {};
                for (const l of links) suggestedXp[l.skillId] = l.xp;
                const t = {
                  id: `${Date.now()}`,
                  title,
                  description,
                  difficulty,
                  relatedSkills,
                  suggestedXp,
                  assignedTo: selectedFighterId,
                  status: 'todo' as const,
                  createdAt: Date.now()
                };
                setTasks(prev => [t, ...prev]);
              }}
              onUpdateStatus={(taskId, status) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))}
              onApproveTask={(taskId, approvedXp) => {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'done', approvedAt: Date.now(), approvedXp } : t));
                const task = tasks.find(t => t.id === taskId);
                const fid = task?.assignedTo;
                if (!fid) return;
                setXpLedger(prev => {
                  const ledger = { ...(prev[fid] ?? {}) } as any;
                  for (const [skillId, xp] of Object.entries(approvedXp)) {
                    ledger[skillId] = (ledger[skillId] ?? 0) + xp;
                  }
                  return { ...prev, [fid]: ledger };
                });
              }}
            />
          </section>
        )}
      </main>
      <footer style={{ padding: '8px 12px', borderTop: '1px solid #eee', color: '#777', fontSize: 12 }}>
        Дані зберігаються локально у localStorage під ключем "skillrpg_ua_v2".
      </footer>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Швидкий старт" width={720}>
        <div style={{ display: 'grid', gap: 10, lineHeight: 1.5 }}>
          <div>
            <strong>1) Вибери або створи бійця</strong>
            <div>У хедері обери «Боєць» або зайди у вкладку «Бійці» і натисни «Додати». У модалі вистав рівні 0–5. Рівень 0 = не призначено.</div>
          </div>
          <div>
            <strong>2) Налаштуй скіли бійця</strong>
            <div>У «Бійці» або у вкладці «Навички» (права панель) можна змінити рівень і призначення для вибраного бійця. Галочка синхронізована з рівнем.</div>
          </div>
          <div>
            <strong>3) Створи задачу</strong>
            <div>У вкладці «Задачі» обери бійця → «+ Створити задачу». Доступні лише призначені йому скіли. Вистав XP для кожного обраного скіла.</div>
          </div>
          <div>
            <strong>4) Процес задачі</strong>
            <div>Перенось статус: To Do → In Progress → Validation. На «Validation» натисни «Затвердити» і введи фінальні XP — вони додадуться у XP бійця.</div>
          </div>
          <div>
            <strong>Корисні дії</strong>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Імпорт/Експорт JSON — у хедері.</li>
              <li>Скинути до початкового seed — жовта кнопка в хедері.</li>
              <li>Очистити локальні дані (бійці/задачі/XP) — червона кнопка в хедері.</li>
              <li>Профілі — можна створювати і перемикати у хедері.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

