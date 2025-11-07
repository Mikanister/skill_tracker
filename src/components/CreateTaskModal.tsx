import { useMemo, useState } from 'react';
import { Category, Fighter, FighterSkills, Skill } from '@/types';
import { Modal } from './Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  fighter?: Fighter;
  categories: Category[];
  fighterSkills: Record<string, FighterSkills>;
  onCreate: (payload: { title: string; description?: string; difficulty?: 1|2|3|4|5; links: { skillId: string; categoryId: string; xp: number }[] }) => void;
};

export function CreateTaskModal({ open, onClose, fighter, fighterSkills, categories, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [xp, setXp] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<1|2|3|4|5>(3);
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const allowedSkills = useMemo(() => {
    if (!fighter) return [] as { skill: Skill; categoryId: string }[];
    const assigned = fighterSkills[fighter.id] || {};
    const list: { skill: Skill; categoryId: string }[] = [];
    for (const c of categories) {
      for (const s of c.skills) {
        if (assigned[s.id]) list.push({ skill: s, categoryId: c.id });
      }
    }
    const term = search.trim().toLowerCase();
    return term ? list.filter(x => x.skill.name.toLowerCase().includes(term)) : list;
  }, [fighter, fighterSkills, categories, search]);

  const toggleSkill = (skillId: string, checked: boolean) => {
    setSelectedSkills(prev => ({ ...prev, [skillId]: checked }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Нова задача"
      width={760}
      footer={(
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={() => {
              setTitle('');
              setDescription('');
              setXp(0);
              setDifficulty(3);
              setSelectedSkills({});
              setError(null);
              onClose();
            }}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
          >Скасувати</button>
          <button
            onClick={() => {
              if (!fighter) return;
              if (!title.trim()) {
                setError('Вкажіть назву задачі.');
                return;
              }
              const picked = Object.keys(selectedSkills).filter(id => selectedSkills[id]);
              if (picked.length === 0) {
                setError('Оберіть хоча б одну навичку.');
                return;
              }
              const payloadLinks = picked.map(skillId => {
                const record = allowedSkills.find(x => x.skill.id === skillId);
                return {
                  skillId,
                  categoryId: record?.categoryId ?? '',
                  xp: Math.max(0, Math.round(xp))
                };
              });
              onCreate({
                title: title.trim(),
                description: description.trim(),
                difficulty,
                links: payloadLinks
              });
              setTitle('');
              setDescription('');
              setXp(0);
              setDifficulty(3);
              setSelectedSkills({});
              setError(null);
              onClose();
            }}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}
          >Створити</button>
        </div>
      )}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--danger-soft-border)', background: 'var(--danger-soft-bg)', color: 'var(--fg)', fontSize: 13 }}>{error}</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Назва</span>
              <input value={title} onChange={e => { setTitle(e.target.value); setError(null); }} placeholder="Опишіть задачу" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Опис</span>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Додайте деталі або посилання" style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)', resize: 'vertical' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>XP за задачу</span>
              <input type="number" value={xp} onChange={e => setXp(Number(e.target.value) || 0)} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Складність</span>
              <select value={difficulty} onChange={e => setDifficulty(Number(e.target.value) as 1|2|3|4|5)} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }}>
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Пошук навички</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Почніть вводити назву" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', boxShadow: 'var(--shadow-sm)' }} />
            </label>
            <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 12, background: 'var(--surface-panel)', display: 'grid', gap: 10 }}>
              {allowedSkills.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 12 }}>Немає навичок для призначення.</div>
              )}
              {allowedSkills.map(({ skill, categoryId }) => (
                <label key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: selectedSkills[skill.id] ? 'var(--accent-soft-pill)' : 'var(--surface-panel-alt)', transition: 'all 0.15s ease' }}>
                  <input type="checkbox" checked={!!selectedSkills[skill.id]} onChange={e => toggleSkill(skill.id, e.target.checked)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--fg)' }}>{skill.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{categories.find(c => c.id === categoryId)?.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
