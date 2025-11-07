import React, { useRef } from 'react';
import { SkillTree, Fighter, FighterSkillLevels, FighterXpLedger, TaskV2 } from '@/types';
import { downloadJSON, downloadCSV, importFromJSON } from '../lib/export';

type ToastApi = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

type Props = {
  tree: SkillTree;
  fighters: Fighter[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  xpLedger: Record<string, FighterXpLedger>;
  tasks: TaskV2[];
  setFighters: React.Dispatch<React.SetStateAction<Fighter[]>>;
  setFighterSkillLevels: React.Dispatch<React.SetStateAction<Record<string, FighterSkillLevels>>>;
  setXpLedger: React.Dispatch<React.SetStateAction<Record<string, FighterXpLedger>>>;
  setTasks: React.Dispatch<React.SetStateAction<TaskV2[]>>;
  onReset: () => void;
  toast: ToastApi;
};

export default function Settings({
  tree,
  fighters,
  fighterSkillLevels,
  xpLedger,
  tasks,
  setFighters,
  setFighterSkillLevels,
  setXpLedger,
  setTasks,
  onReset,
  toast
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    downloadJSON(
      {
        tree,
        fighters,
        fighterSkillLevels,
        xpLedger,
        tasksV2: tasks
      },
      `skillrpg-backup-${new Date().toISOString().split('T')[0]}.json`
    );
    toast.success('Дані експортовано в JSON');
  };

  const handleExportCSV = () => {
    downloadCSV(
      fighters,
      xpLedger,
      tree.categories,
      `skillrpg-fighters-${new Date().toISOString().split('T')[0]}.csv`
    );
    toast.success('Бійці експортовані в CSV');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const result = evt.target?.result as string;
      const data = importFromJSON(result);

      if (!data) {
        toast.error('Помилка імпорту: неправильний формат');
        return;
      }

      if (confirm('Це замінить всі поточні дані. Продовжити?')) {
        setFighters(data.fighters);
        setFighterSkillLevels(data.fighterSkillLevels);
        setXpLedger(data.xpLedger);
        setTasks(data.tasksV2);
        toast.success('Дані імпортовано');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ padding: 32, maxWidth: 840, display: 'grid', gap: 26 }}>
      <header>
        <h2 style={{ margin: 0, fontSize: 30 }}>Налаштування</h2>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>Резервні копії, імпорт та управління даними</p>
      </header>

      <section style={{ borderRadius: 18, border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', padding: 24, boxShadow: 'var(--shadow-lg)', display: 'grid', gap: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>Експорт/Імпорт</h3>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)' }}>Збережіть резервну копію або імпортуйте поточні дані.</p>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button onClick={handleExportJSON} style={{ padding: '12px 18px', borderRadius: 14, background: 'var(--accent-soft-bg)', border: '1px solid var(--accent-soft-border)', color: 'var(--fg)', fontWeight: 600, letterSpacing: '0.01em', boxShadow: 'var(--shadow-sm)' }}>
              📥 Експорт JSON
            </button>
            <button onClick={handleExportCSV} style={{ padding: '12px 18px', borderRadius: 14, background: 'var(--surface-panel-alt)', border: '1px solid var(--border-subtle)', color: 'var(--fg)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>
              📊 Експорт CSV (бійці)
            </button>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
              id="import-file"
            />
            <label htmlFor="import-file">
              <button onClick={() => fileInputRef.current?.click()} style={{ padding: '12px 18px', borderRadius: 14, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>
                📤 Імпорт JSON
              </button>
            </label>
          </div>
        </div>
      </section>

      <section style={{ borderRadius: 18, border: '1px solid var(--border-subtle)', padding: 24, background: 'var(--surface-card)', display: 'grid', gap: 16, boxShadow: 'var(--shadow-md)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>Статистика</h3>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)' }}>Огляд поточного стану бази навичок.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <StatCard label="Бійців" value={fighters.length} accent="teal" />
          <StatCard label="Категорій" value={tree.categories.length} accent="blue" />
          <StatCard label="Навичок" value={tree.categories.reduce((sum, c) => sum + c.skills.length, 0)} accent="violet" />
          <StatCard label="Задач" value={tasks.length} accent="amber" />
        </div>
      </section>

      <section style={{ borderRadius: 18, border: '1px solid var(--danger-soft-border)', padding: 24, background: 'var(--surface-danger-soft)', boxShadow: 'var(--shadow-md)', display: 'grid', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>Небезпечна зона</h3>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)' }}>Скидання видалить всі дані без можливості відновлення.</p>
        </div>
        <button
          onClick={() => {
            if (confirm('Видалити ВСІ дані? Це неможливо відмінити!')) {
              onReset();
              toast.info('Дані скинуті');
            }
          }}
          style={{ padding: '12px 18px', borderRadius: 14, background: 'var(--danger-soft-bg)', border: '1px solid var(--danger-soft-border)', color: 'var(--fg)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}
        >
          🗑️ Скинути всі дані
        </button>
      </section>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  accent: 'teal' | 'blue' | 'violet' | 'amber';
};

const accents: Record<StatCardProps['accent'], { fill: string; glow: string }> = {
  teal: {
    fill: 'linear-gradient(135deg, rgba(20,184,166,0.68) 0%, rgba(13,148,136,0.62) 100%)',
    glow: '0 10px 25px rgba(13,148,136,0.35)'
  },
  blue: {
    fill: 'linear-gradient(135deg, rgba(59,130,246,0.68) 0%, rgba(37,99,235,0.62) 100%)',
    glow: '0 10px 25px rgba(37,99,235,0.35)'
  },
  violet: {
    fill: 'linear-gradient(135deg, rgba(139,92,246,0.68) 0%, rgba(124,58,237,0.62) 100%)',
    glow: '0 10px 25px rgba(124,58,237,0.35)'
  },
  amber: {
    fill: 'linear-gradient(135deg, rgba(251,191,36,0.72) 0%, rgba(245,158,11,0.6) 100%)',
    glow: '0 10px 28px rgba(245,158,11,0.32)'
  }
};

function StatCard({ label, value, accent }: StatCardProps) {
  const palette = accents[accent];
  return (
    <div style={{ borderRadius: 16, padding: 18, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)', display: 'grid', gap: 6, boxShadow: 'var(--shadow-sm)' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <strong style={{ fontSize: 26 }}>{value}</strong>
        <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--stat-progress-track)', overflow: 'hidden', boxShadow: palette.glow }}>
          <div style={{ width: '100%', height: '100%', background: palette.fill }} />
        </div>
      </div>
    </div>
  );
}
