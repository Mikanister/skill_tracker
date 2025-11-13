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
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100vh', fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif', background: 'var(--app-shell-bg)', color: 'var(--fg)' }}>
      <aside style={{ borderRight: '1px solid var(--sidebar-border)', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--sidebar-bg)', backdropFilter: 'blur(12px)', boxShadow: 'var(--sidebar-shadow)' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>SkillRPG</div>
          <div style={{ fontWeight: 800, fontSize: 22 }}>UA Command</div>
        </div>
        <nav style={{ display: 'grid', gap: 10 }}>
          <NavLink to="/" end style={({ isActive }) => navStyle(isActive)}>Дошка задач</NavLink>
          <NavLink to="/fighters" style={({ isActive }) => navStyle(isActive)}>Бійці</NavLink>
          <NavLink to="/skills" style={({ isActive }) => navStyle(isActive)}>Каталог навичок</NavLink>
          <NavLink to="/settings" style={({ isActive }) => navStyle(isActive)}>Налаштування</NavLink>
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
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--spotlight-1)' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'var(--spotlight-2)' }} />
        <div style={{ position: 'relative', height: '100%', overflow: 'auto', backdropFilter: 'blur(6px)' }}>
        <Routes>
          <Route path="/" element={<Home
            fighters={state.fighters}
            categories={state.tree.categories}
            tasks={state.tasksV2}
            createTask={state.createTaskV2}
            updateStatus={state.updateTaskV2Status}
            updateDetails={state.updateTaskV2Details}
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

function navStyle(active: boolean): React.CSSProperties {
  return {
    padding: '12px 14px',
    borderRadius: 12,
    textDecoration: 'none',
    color: 'var(--fg)',
    fontWeight: 600,
    letterSpacing: '0.02em',
    background: active ? 'var(--nav-active-bg)' : 'var(--nav-inactive-bg)',
    border: active ? `1px solid var(--nav-active-border)` : `1px solid var(--nav-inactive-border)`,
    boxShadow: active ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    transition: 'all 0.2s ease'
  };
}
