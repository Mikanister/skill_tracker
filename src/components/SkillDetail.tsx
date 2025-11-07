import { Mode, Skill, FighterSkillLevels, FighterSkills } from '@/types';
import { LevelEditor } from './LevelEditor';
import { getSkillProgress } from '@/utils';

type Props = {
  skill?: Skill;
  mode: Mode;
  onChange: (skill: Skill) => void;
  onDelete: (skillId: string) => void;
  selectedFighterId?: string | null;
  fighterSkills?: Record<string, FighterSkills>;
  fighterSkillLevels?: Record<string, FighterSkillLevels>;
  onToggleSkill?: (fighterId: string, skillId: string, assigned: boolean) => void;
  onSetLevel?: (fighterId: string, skillId: string, level: 0|1|2|3|4|5) => void;
};

export function SkillDetail({ skill, mode, onChange, onDelete, selectedFighterId, fighterSkills, fighterSkillLevels, onToggleSkill, onSetLevel }: Props) {
  if (!skill) {
    return <div style={{ padding: 12 }}>Виберіть скіл</div>;
  }

  const progress = getSkillProgress(skill);

  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h3 style={{ margin: 0 }}>{skill.name}</h3>
        <span style={{ color: 'var(--muted)' }}>(прогрес: {progress.pct}% — {progress.done}/{progress.total})</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {mode === 'edit' && (
            <button
              onClick={() => onChange({ ...skill, isArchived: !skill.isArchived })}
              style={{ padding: '6px 10px' }}
            >
              {skill.isArchived ? 'Розархівувати' : 'Архівувати'}
            </button>
          )}
          {mode === 'edit' && (
            <button
              onClick={() => {
                const copy = { ...skill, id: `${Date.now()}`, name: `${skill.name} (копія)`, updatedAt: Date.now() };
                onChange(copy);
              }}
              style={{ padding: '6px 10px' }}
            >
              Клонувати
            </button>
          )}
          {mode === 'edit' && (
            <button onClick={() => onDelete(skill.id)} style={{ padding: '6px 10px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 6 }}>Видалити</button>
          )}
        </div>
      </div>
      {selectedFighterId && (
        <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', border: '1px dashed var(--border)', borderRadius: 8 }}>
          <strong>Рівень бійця</strong>
          <span style={{ fontSize: 12, padding: '2px 8px', border: '1px solid var(--border)', borderRadius: 999, background: 'var(--panel)' }}>
            lvl {(fighterSkillLevels?.[selectedFighterId]?.[skill.id] ?? 0) as number}
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={!!fighterSkills?.[selectedFighterId]?.[skill.id]}
              onChange={e => {
                const checked = e.target.checked;
                onToggleSkill?.(selectedFighterId, skill.id, checked);
              }}
            />
            Призначено
          </label>
        </div>
      )}
      <textarea
        placeholder="Опис скілу"
        value={skill.description ?? ''}
        onChange={e => onChange({ ...skill, description: e.target.value })}
        readOnly={mode !== 'edit'}
        style={{ marginTop: 8, padding: 8, borderRadius: 6, resize: 'vertical', minHeight: 60 }}
      />
      <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {(skill.tags ?? []).map((tag, i) => (
          <span key={i} style={{ fontSize: 12, padding: '2px 6px', background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 999 }}>{tag}</span>
        ))}
        {mode === 'edit' && (
          <button
            className="no-print"
            onClick={() => {
              const t = prompt('Додати тег');
              if (!t) return;
              const tag = t.trim();
              if (!tag) return;
              onChange({ ...skill, tags: [ ...(skill.tags ?? []), tag ] });
            }}
            style={{ padding: '2px 6px' }}
          >
            + тег
          </button>
        )}
      </div>
      <div style={{ marginTop: 12, overflow: 'auto' }}>
        {skill.levels.map(level => (
          <LevelEditor
            key={level.level}
            level={level}
            mode={mode}
            onChange={lvl => {
              const updated = { ...skill, levels: skill.levels.map(l => (l.level === lvl.level ? lvl : l)) };
              onChange(updated);
            }}
          />
        ))}
      </div>
    </div>
  );
}

