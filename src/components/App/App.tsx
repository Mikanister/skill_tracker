import React from 'react';
import { useSkillRpgState } from '@/state';
import { FighterSkills } from '@/types';
import { AppHeader } from './AppHeader';
import { SkillsView } from './SkillsView';
import { FightersView } from './FightersView';
import { AppFooter } from './AppFooter';
import { HelpModal } from './HelpModal';

const THEME_STORAGE_KEY = 'skillrpg_theme';

function useThemePreference() {
  const [theme, setTheme] = React.useState<string>(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light');

  const toggleTheme = React.useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return { theme, toggleTheme };
}

export default function App() {
  const state = useSkillRpgState();
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
    setTasksV2,
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
  } = state;

  const { theme, toggleTheme } = useThemePreference();
  const [search, setSearch] = React.useState('');
  const [showArchived, setShowArchived] = React.useState(false);
  const [topView, setTopView] = React.useState<'skills' | 'fighters'>('skills');
  const [helpOpen, setHelpOpen] = React.useState(false);

  const handleSelectCategory = React.useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedSkillId(null);
  }, [setSelectedCategoryId, setSelectedSkillId]);

  const handleCreateSkill = React.useCallback((name: string) => {
    if (!selectedCategoryId) return;
    addSkill(selectedCategoryId, name);
  }, [addSkill, selectedCategoryId]);

  const handleToggleSkillAssignment = React.useCallback((fighterId: string, skillId: string, assigned: boolean) => {
    setFighterSkills((prev: Record<string, FighterSkills>) => ({
      ...prev,
      [fighterId]: { ...(prev[fighterId] ?? {}), [skillId]: assigned }
    }));
  }, [setFighterSkills]);

  const handleClearLocalData = React.useCallback(() => {
    if (!confirm('Очистити локальні дані бійців/задач/XP?')) return;
    try {
      localStorage.removeItem('skillrpg_fighters');
      localStorage.removeItem('skillrpg_tasks');
      localStorage.removeItem('skillrpg_xp');
      localStorage.removeItem('skillrpg_fighter_skills');
      localStorage.removeItem('skillrpg_fighter_skill_levels');
      localStorage.removeItem('skillrpg_tasks_v2');
    } catch {}
    setFighters([]);
    setSelectedFighterId(null);
    setTasksV2([]);
    setXpLedger({});
    setFighterSkills({});
    setFighterSkillLevels({});
  }, [setFighterSkillLevels, setFighterSkills, setFighters, setSelectedFighterId, setTasksV2, setXpLedger]);

  const handleExportJson = React.useCallback(() => {
    const data = JSON.stringify(tree, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'skillrpg_ua_backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [tree]);

  const handleImportJson = React.useCallback(async (file: File) => {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      (window as any).dispatchEvent(new CustomEvent('skillrpg_import', { detail: parsed }));
    } catch {
      alert('Некоректний JSON');
    }
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <AppHeader
        topView={topView}
        onTopViewChange={setTopView}
        profile={profile}
        profiles={profiles}
        onSwitchProfile={switchProfile}
        selectedFighterId={selectedFighterId}
        fighters={fighters}
        onSelectFighter={setSelectedFighterId}
        onClearFighter={() => setSelectedFighterId(null)}
        mode={mode}
        onToggleMode={() => setMode(mode === 'view' ? 'edit' : 'view')}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenHelp={() => setHelpOpen(true)}
        onResetToSeed={onResetToSeed}
        onClearLocalData={handleClearLocalData}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: topView === 'skills' ? (selectedSkill ? '280px 320px 1fr' : '280px 1fr') : '1fr', minHeight: 0 }}>
        {topView === 'skills' && (
          <SkillsView
            tree={tree}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
            selectedCategory={selectedCategory}
            selectedSkillId={selectedSkillId}
            onSelectSkill={setSelectedSkillId}
            selectedSkill={selectedSkill}
            search={search}
            onSearchChange={setSearch}
            showArchived={showArchived}
            onToggleArchived={setShowArchived}
            onCreateSkill={handleCreateSkill}
            mode={mode}
            onUpdateSkill={updateSkill}
            onDeleteSkill={deleteSkill}
            selectedFighterId={selectedFighterId}
            fighterSkills={fighterSkills}
            fighterSkillLevels={fighterSkillLevels}
            onToggleSkillAssignment={handleToggleSkillAssignment}
          />
        )}

        {topView === 'fighters' && (
          <FightersView
            fighters={fighters}
            selectedFighterId={selectedFighterId}
            onSelectFighter={setSelectedFighterId}
            onAddFighter={addFighter}
            categories={tree.categories}
            fighterSkills={fighterSkills}
            fighterSkillLevels={fighterSkillLevels}
            onToggleSkillAssignment={handleToggleSkillAssignment}
          />
        )}
      </main>

      <AppFooter />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
