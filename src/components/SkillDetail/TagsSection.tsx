import React from 'react';
import { Mode, Skill } from '@/types';

type TagsSectionProps = {
  skill: Skill;
  mode: Mode;
  onChange: (skill: Skill) => void;
};

export const TagsSection: React.FC<TagsSectionProps> = ({ skill, mode, onChange }) => (
  <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
    {(skill.tags ?? []).map((tag, index) => (
      <span
        key={`${tag}-${index}`}
        style={{ fontSize: 12, padding: '2px 6px', background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 999 }}
      >
        {tag}
      </span>
    ))}
    {mode === 'edit' && (
      <button
        className="no-print"
        onClick={() => {
          const raw = prompt('Додати тег');
          if (!raw) return;
          const tag = raw.trim();
          if (!tag) return;
          onChange({ ...skill, tags: [...(skill.tags ?? []), tag] });
        }}
        style={{ padding: '2px 6px' }}
      >
        + тег
      </button>
    )}
  </div>
);
