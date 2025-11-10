import React, { useRef } from 'react';
import { SkillTree, Fighter, FighterSkillLevels, FighterXpLedger, TaskV2 } from '@/types';
import { downloadJSON, downloadCSV, importFromJSON } from '../lib/export';
import { useFormState } from '@/hooks/useFormState';

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

  const {
    values: dangerValues,
    registerField: registerDangerField,
    setValue: setDangerValue,
    reset: resetDangerForm,
    validate: validateDangerForm,
    errors: dangerErrors,
    clearErrors: clearDangerErrors
  } = useFormState({ confirmation: '' }, {
    confirmation: value => (value === 'DELETE' ? null : 'Для підтвердження введіть DELETE')
  });

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

  const handleResetConfirm = () => {
    clearDangerErrors();
    setDangerValue('confirmation', '');
  };

  return (
    <div className="settings-container">
      <header className="page-header">
        <h2 className="page-title">Налаштування</h2>
        <p className="page-subtitle">Резервні копії, імпорт та управління даними</p>
      </header>

      <section className="section-card">
        <div className="section-heading">
          <h3 className="text-md text-strong">Експорт/Імпорт</h3>
          <p className="text-sm text-muted">Збережіть резервну копію або імпортуйте поточні дані.</p>
        </div>
        <div className="action-grid">
          <div className="button-group">
            <button onClick={handleExportJSON} className="btn-primary">
              📥 Експорт JSON
            </button>
            <button onClick={handleExportCSV} className="btn-secondary">
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
            <label htmlFor="import-file" className="file-trigger">
              <button onClick={() => fileInputRef.current?.click()} className="btn-success-soft">
                📤 Імпорт JSON
              </button>
            </label>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h3 className="text-md text-strong">Статистика</h3>
          <p className="text-sm text-muted">Огляд поточного стану бази навичок.</p>
        </div>
        <div className="stat-grid">
          <StatCard label="Бійців" value={fighters.length} accent="teal" />
          <StatCard label="Категорій" value={tree.categories.length} accent="blue" />
          <StatCard label="Навичок" value={tree.categories.reduce((sum, c) => sum + c.skills.length, 0)} accent="violet" />
          <StatCard label="Задач" value={tasks.length} accent="amber" />
        </div>
      </section>

      <section className="section-card section-card--danger">
        <div className="section-heading">
          <h3 className="text-md text-strong">Небезпечна зона</h3>
          <p className="text-sm text-muted">Скидання видалить всі дані без можливості відновлення.</p>
        </div>
        <div className="danger-panel">
          <strong className="text-sm text-strong">Що буде видалено:</strong>
          <ul className="list-muted">
            <li>Усі профілі бійців та їхній прогрес</li>
            <li>Каталог навичок і категорії</li>
            <li>Журнал задач і коментарі</li>
            <li>Налаштування та історія імпортів</li>
          </ul>
          <div className="danger-hint">
            <span>Бажано зберегти резервну копію перед очисткою.</span>
            <button onClick={handleExportJSON} className="btn-secondary">Експортувати зараз</button>
          </div>
        </div>
        <label className="labeled-field text-xs text-muted">
          <span>Для підтвердження введіть <strong>DELETE</strong>:</span>
          <input {...registerDangerField('confirmation')} placeholder="Введіть DELETE" className="confirm-input" />
          {dangerErrors.confirmation && (
            <span className="text-xs" style={{ color: 'var(--danger)' }}>{dangerErrors.confirmation}</span>
          )}
        </label>
        <button
          onClick={() => {
            if (!validateDangerForm()) {
              toast.error('Для підтвердження введіть DELETE');
              return;
            }
            if (confirm('Видалити ВСІ дані? Це неможливо відмінити!')) {
              onReset();
              toast.info('Дані скинуті');
              resetDangerForm({ confirmation: '' });
            }
          }}
          className="btn-danger-strong"
          data-active={dangerValues.confirmation === 'DELETE'}
          style={{
            background: dangerValues.confirmation === 'DELETE' ? 'var(--danger-soft-bg)' : 'rgba(239,68,68,0.2)',
            cursor: dangerValues.confirmation === 'DELETE' ? 'pointer' : 'not-allowed'
          }}
          disabled={dangerValues.confirmation !== 'DELETE'}
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

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <span className="stat-card__label">{label}</span>
      <div className="stat-card__row">
        <strong className="stat-card__value">{value}</strong>
        <div className="stat-card__bar">
          <div className="stat-card__bar-fill" />
        </div>
      </div>
    </div>
  );
}
