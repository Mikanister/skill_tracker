import React from 'react';
import type { Category, Skill } from '@/types';

export type AllowedSkill = {
  skill: Skill;
  categoryId: string;
};

export type SkillSelectorProps = {
  search: string;
  onSearchChange: (value: string) => void;
  skills: AllowedSkill[];
  selectedSkills: Record<string, boolean>;
  onToggleSkill: (skillId: string, checked: boolean) => void;
  categories: Category[];
};

const categoryNameLookup = (categories: Category[]) => {
  const map = new Map<string, string>();
  categories.forEach(category => {
    map.set(category.id, category.name);
  });
  return map;
};

export const SkillSelector: React.FC<SkillSelectorProps> = ({
  search,
  onSearchChange,
  skills,
  selectedSkills,
  onToggleSkill,
  categories
}) => {
  const categoryNames = React.useMemo(() => categoryNameLookup(categories), [categories]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
        <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Пошук навички</span>
        <input
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Почніть вводити назву"
          style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }}
        />
      </label>

      <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 12, background: 'var(--surface-panel)', display: 'grid', gap: 10 }}>
        {skills.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 12 }}>Немає навичок для призначення.</div>
        )}

        {skills.map(({ skill, categoryId }) => {
          const checked = !!selectedSkills[skill.id];
          const categoryName = categoryNames.get(categoryId) ?? '—';
          return (
            <label
              key={skill.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: checked ? 'var(--accent-soft-pill)' : 'var(--surface-panel-alt)',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={event => onToggleSkill(skill.id, event.target.checked)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--fg)' }}>{skill.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{categoryName}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
