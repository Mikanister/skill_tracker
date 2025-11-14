import React from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Fighters from './pages/Fighters';
import Skills from './pages/Skills';
import Settings from './pages/Settings';
import { useSkillRpgState } from './state';
import { ToastContainer, useToast } from './components/Toast';

export default function AppShell() {
  const [theme, setTheme] = React.useState<string>(() => localStorage.getItem('skillrpg_theme') || 'dark');
  const state = useSkillRpgState();
  const toast = useToast();
  const toastApi = React.useMemo(() => ({
    success: toast.success,
    error: toast.error,
    info: toast.info
  }), [toast.success, toast.error, toast.info]);
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('skillrpg_theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>SkillRPG</div>
          <div style={{ fontWeight: 800, fontSize: 22 }}>UA Command</div>
        </div>
        <nav className="app-shell__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'app-shell__nav-link app-shell__nav-link--active' : 'app-shell__nav-link'
            }
          >
            Дошка задач
          </NavLink>
          <NavLink
            to="/fighters"
            className={({ isActive }) =>
              isActive ? 'app-shell__nav-link app-shell__nav-link--active' : 'app-shell__nav-link'
            }
          >
            Бійці
          </NavLink>
          <NavLink
            to="/skills"
            className={({ isActive }) =>
              isActive ? 'app-shell__nav-link app-shell__nav-link--active' : 'app-shell__nav-link'
            }
          >
            Каталог навичок
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? 'app-shell__nav-link app-shell__nav-link--active' : 'app-shell__nav-link'
            }
          >
            Налаштування
          </NavLink>
        </nav>
        <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
          {state.canUndo && (
            <button 
              onClick={() => {
                const desc = state.performUndo();
                if (desc) toast.success(`Відновлено: ${desc}`);
              }}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: 'var(--accent-soft-bg)',
                border: '1px solid var(--accent-soft-border)',
                color: 'var(--fg)',
                fontWeight: 600,
                letterSpacing: '0.01em'
              }}
            >
              ↺ Відмінити
            </button>
          )}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-panel-alt)',
              color: 'var(--fg)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {theme === 'light' ? 'Темна тема' : 'Світла тема'}
          </button>
        </div>
      </aside>
      <section className="app-shell__main">
        <div className="app-shell__main-spotlight-primary" />
        <div className="app-shell__main-spotlight-secondary" />
        <div className="app-shell__main-scroll">
        <Routes>
          <Route path="/" element={<Home
            fighters={state.fighters}
            categories={state.tree.categories}
            tasks={state.tasksV2}
            createTask={state.createTaskV2}
            updateStatus={state.updateTaskV2Status}
            updateDetails={state.updateTaskV2Details}
            updateAssignees={state.updateTaskV2Assignees}
            approveTask={state.approveTaskV2}
            deleteTask={state.deleteTaskV2}
            fighterSkillLevels={state.fighterSkillLevels}
            addComment={state.addTaskComment}
            markTaskCommentsRead={state.markTaskCommentsRead}
          />} />
          <Route path="/fighters" element={<Fighters
            fighters={state.fighters}
            categories={state.tree.categories}
            fighterSkillLevels={state.fighterSkillLevels}
            xpLedger={state.xpLedger}
            addFighter={state.addFighter}
            tasks={state.tasksV2}
            deleteFighter={state.deleteFighter}
          />} />
          <Route path="/skills" element={<Skills
            categories={state.tree.categories}
            fighters={state.fighters}
            fighterSkillLevels={state.fighterSkillLevels}
            addSkill={state.addSkill}
            updateSkill={state.updateSkill}
            deleteSkill={state.deleteSkill}
            addCategory={state.addCategory}
            renameCategory={state.renameCategory}
            deleteCategory={state.deleteCategory}
            moveSkillToCategory={state.moveSkillToCategory}
          />} />
          <Route path="/settings" element={<Settings
            tree={state.tree}
            fighters={state.fighters}
            fighterSkillLevels={state.fighterSkillLevels}
            xpLedger={state.xpLedger}
            tasks={state.tasksV2}
            setFighters={state.setFighters}
            setFighterSkillLevels={state.setFighterSkillLevels}
            setXpLedger={state.setXpLedger}
            setTasks={state.setTasksV2}
            onReset={state.onResetToSeed}
            toast={toastApi}
          />} />
        </Routes>
        </div>
      </section>
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
    </div>
  );
}
