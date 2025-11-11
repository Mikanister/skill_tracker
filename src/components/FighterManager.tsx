import { Category, Fighter, FighterSkills, FighterSkillLevels } from '@/types';
import { useMemo, useState } from 'react';
import { Modal } from './Modal';

type Props = {
  fighters: Fighter[];
  selectedFighterId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (name: string, initialLevels: FighterSkillLevels) => void;
  categories: Category[];
  fighterSkills: Record<string, FighterSkills>;
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  onToggleSkill: (fighterId: string, skillId: string, assigned: boolean) => void;
  onSetLevel: (fighterId: string, skillId: string, level: 0|1|2|3|4|5) => void;
};

export function FighterManager({ fighters, selectedFighterId, onSelect, onAdd, categories, fighterSkills, fighterSkillLevels, onToggleSkill, onSetLevel }: Props) {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [levels, setLevels] = useState<FighterSkillLevels>({});
  const [editingFighterId, setEditingFighterId] = useState<string | null>(null);

  const skillsList = useMemo(() => {
    const items: { categoryId: string; categoryName: string; skillId: string; skillName: string }[] = [];
    for (const c of categories) for (const s of c.skills) items.push({ categoryId: c.id, categoryName: c.name, skillId: s.id, skillName: s.name });
    return items;
  }, [categories]);

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Бійці</h3>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ім'я бійця" style={{ flex: 1, padding: 8, border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'var(--surface-panel)', color: 'var(--fg)' }} />
        <button
          onClick={() => {
            const v = name.trim();
            if (!v) return;
            // prepare default levels (0)
            const init: FighterSkillLevels = {};
            for (const c of categories) for (const s of c.skills) init[s.id] = 0;
            setLevels(init);
            setEditingFighterId(null);
            setOpen(true);
          }}
          style={{ padding: '8px 12px' }}
        >
          Додати
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {fighters.map(f => (
          <li key={f.id}>
            <button
              onClick={() => onSelect(f.id)}
              style={{ width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 6, background: f.id === selectedFighterId ? 'var(--surface-accent-pill)' : 'var(--surface-panel)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}
            >
              {f.name}
            </button>
          </li>
        ))}
      </ul>
      {selectedFighterId && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Призначені скіли та рівні</div>
          {categories.map(cat => (
            <div key={cat.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{cat.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8 }}>
                {cat.skills.map(s => {
                  const assigned = !!fighterSkills[selectedFighterId!]?.[s.id];
                  const level = (fighterSkillLevels[selectedFighterId!]?.[s.id] ?? 0) as 0|1|2|3|4|5|6|7|8|9|10;
                  return (
                    <>
                      <label key={s.id + '-lbl'} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: 999, background: 'var(--surface-panel-alt)' }}>
                        <input
                          type="checkbox"
                          checked={assigned}
                          onChange={e => {
                            const checked = e.target.checked;
                            onToggleSkill(selectedFighterId!, s.id, checked);
                            // level змінюється тільки XP/створенням; при знятті галочки нижче просто залишаємо рівень як є
                            if (!checked && level > 0) {
                              // не змінюємо рівень, лише знімаємо призначення
                            }
                          }}
                        />
                        {s.name}
                      </label>
                      <span key={s.id + '-lvl'} style={{ fontSize: 12, padding: '2px 8px', border: '1px solid var(--border-subtle)', borderRadius: 999, color: 'var(--muted)' }}>lvl {level}</span>
                    </>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingFighterId ? "Рівні скілів бійця" : "Початкові рівні скілів"} width={720}>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ color: 'var(--muted)' }}>
            <>Вкажіть рівні володіння навичками для «{name.trim()}». Рівень 0 означає, що навичка не призначена. Після створення рівні змінюються лише від XP.</>
          </div>
          <div style={{ maxHeight: 420, overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 8, background: 'var(--surface-panel)' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{cat.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
                  {cat.skills.map(s => (
                    <>
                      <div key={s.id + '-lbl'} style={{ display: 'flex', alignItems: 'center' }}>{s.name}</div>
                      <select
                        key={s.id + '-sel'}
                        value={levels[s.id] ?? 0}
                        onChange={e => setLevels(prev => ({ ...prev, [s.id]: Number(e.target.value) as 0|1|2|3|4|5|6|7|8|9|10 }))}
                        style={{ padding: '4px 6px', width: 70, border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'var(--surface-panel)', color: 'var(--fg)' }}
                      >
                        {[0,1,2,3,4,5,6,7,8,9,10].map(n => (<option key={n} value={n}>{n}</option>))}
                      </select>
                    </>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setOpen(false)}>Скасувати</button>
            <button
              onClick={() => {
                const v = name.trim();
                if (!v) return;
                onAdd(v, levels);
                setName('');
                setOpen(false);
              }}
              style={{ padding: '6px 10px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 6, color: 'var(--fg)' }}
            >
              Створити бійця
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

