import { Category, Skill } from '@/types';
import { useMemo, useState } from 'react';

type Props = {
  category?: Category;
  selectedSkillId: string | null;
  onSelect: (skillId: string) => void;
  onCreateSkill: (name: string) => void;
  showArchived?: boolean;
  search?: string;
};

export function SkillList({ category, selectedSkillId, onSelect, onCreateSkill, showArchived, search }: Props) {
  const [newName, setNewName] = useState('');
  const skills: Skill[] = useMemo(() => {
    let list = category?.skills ?? [];
    if (!showArchived) list = list.filter(s => !s.isArchived);
    const term = (search ?? '').toLowerCase();
    if (term) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(term) ||
        (s.tags ?? []).some(t => t.toLowerCase().includes(term))
      );
    }
    return list;
  }, [category, showArchived, search]);

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Скіли</h3>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input
          placeholder="Новий скіл..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 6 }}
        />
        <button
          onClick={() => {
            const name = newName.trim();
            if (!name || !category) return;
            onCreateSkill(name);
            setNewName('');
          }}
          style={{ padding: '8px 12px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 6 }}
        >
          Додати
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {skills.map(s => (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                marginBottom: 6,
                background: s.id === selectedSkillId ? 'var(--accent)' : 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              {s.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

