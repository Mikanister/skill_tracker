import React, { useRef } from 'react';
import {
  SkillTree,
  Fighter,
  FighterSkillLevels,
  FighterXpLedger,
  TaskV2
} from '@/types';
import { downloadJSON, downloadCSV, importFromJSON } from '@/lib/export';
import { useFormState } from '@/hooks/useFormState';
import { PageHeader } from '@/components/PageHeader';
import { ExportImportSection } from './components/ExportImportSection';
import { StatsSection } from './components/StatsSection';
import { DangerZoneSection } from './components/DangerZoneSection';

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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = loadEvent => {
      const result = loadEvent.target?.result as string;
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

  const handleDangerInputFocus = () => {
    clearDangerErrors();
    setDangerValue('confirmation', '');
  };

  const handleDangerSubmit = () => {
    if (!validateDangerForm()) {
      toast.error('Для підтвердження введіть DELETE');
      return;
    }
    if (confirm('Видалити ВСІ дані? Це неможливо відмінити!')) {
      onReset();
      toast.info('Дані скинуті');
      resetDangerForm({ confirmation: '' });
    }
  };

  const confirmationField = registerDangerField('confirmation');

  return (
    <div className="settings-container">
      <PageHeader
        title="Налаштування"
        description="Резервні копії, імпорт та управління даними"
      />

      <ExportImportSection
        onExportJson={handleExportJSON}
        onExportCsv={handleExportCSV}
        onImportChange={handleImport}
        fileInputRef={fileInputRef}
      />

      <StatsSection
        fightersCount={fighters.length}
        categoriesCount={tree.categories.length}
        skillsCount={tree.categories.reduce((sum, category) => sum + category.skills.length, 0)}
        tasksCount={tasks.length}
      />

      <DangerZoneSection
        confirmationField={confirmationField}
        confirmationError={dangerErrors.confirmation}
        confirmationValue={dangerValues.confirmation}
        onSubmit={handleDangerSubmit}
        onInputFocus={handleDangerInputFocus}
        onExportNow={handleExportJSON}
      />
    </div>
  );
}
