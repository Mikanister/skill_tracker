import React, { useMemo, useState } from 'react';
import { Category, Fighter, FighterSkillLevels, TaskV2 } from '@/types';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { SkillProgress } from '@/components/SkillProgress';
import { SegmentedLevelInput } from '@/components/SegmentedLevelInput';

type LevelValue = 0|1|2|3|4|5|6|7|8|9|10;

type Props = {
  fighters: Fighter[];
  categories: Category[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  xpLedger: Record<string, Record<string, number>>;
  addFighter: (name: string, initialLevels: FighterSkillLevels, meta?: Partial<Fighter>) => void;
  tasks: TaskV2[];
  deleteFighter: (fighterId: string) => void;
};

export default function Fighters({ fighters, categories, fighterSkillLevels, xpLedger, addFighter, tasks, deleteFighter }: Props) {
  const [selectedFighterId, setSelectedFighterId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [name, setName] = useState('');
  const [callsignValue, setCallsignValue] = useState('');
  const [rankValue, setRankValue] = useState('');
  const [positionValue, setPositionValue] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [notesValue, setNotesValue] = useState('');
  const [levels, setLevels] = useState<FighterSkillLevels>({});
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modalSearch, setModalSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const setValuesToDefaults = () => {
    const init: FighterSkillLevels = {} as FighterSkillLevels;
    for (const c of categories) for (const s of c.skills) init[s.id] = 0 as LevelValue;
    setLevels(init);
    setName('');
    setCallsignValue('');
    setRankValue('');
    setPositionValue('');
    setUnitValue('');
    setNotesValue('');
    setModalSearch('');
    setFormError(null);
  };

  const handleCloseCreateModal = () => {
    setOpen(false);
    setValuesToDefaults();
  };

  const selectedFighter = useMemo(() => fighters.find(f => f.id === selectedFighterId) || null, [fighters, selectedFighterId]);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.map(c => ({
      ...c,
      skills: c.skills.filter(s => s.name.toLowerCase().includes(term))
    }));
  }, [categories, search]);

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 20, padding: 24, background: 'var(--surface-panel-alt)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 30 }}>Особовий склад</h2>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{fighters.length} бійців у строю</div>
        </div>
        <input
          placeholder="Пошук бійця"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: 280,
            padding: '12px 14px',
            borderRadius: 14,
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-panel)',
            color: 'var(--fg)',
            boxShadow: 'var(--shadow-sm)'
          }}
        />
        <button
          onClick={() => {
            setValuesToDefaults();
            setOpen(true);
          }}
          style={{
            padding: '12px 18px',
            borderRadius: 14,
            background: 'var(--accent-soft-bg)',
            border: '1px solid var(--accent-soft-border)',
            color: 'var(--fg)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            boxShadow: 'var(--shadow-sm)'
          }}
        >+ Додати бійця</button>
      </header>

      <div style={{ flex: 1 }}>
        {fighters.filter(f => f.name.toLowerCase().includes(search.trim().toLowerCase())).length === 0 ? (
          <EmptyState
            icon="🧍"
            title={fighters.length === 0 ? 'Поки що немає бійців' : 'Не знайдено бійців'}
            description={fighters.length === 0 ? 'Додайте першого бійця, щоб почати відслідковувати навички.' : 'Змініть критерії пошуку або створіть нового бійця.'}
            action={{ label: '+ Додати бійця', onClick: () => {
              setValuesToDefaults();
              setOpen(true);
            } }}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
            {fighters
              .filter(f => f.name.toLowerCase().includes(search.trim().toLowerCase()))
              .map(f => {
                const topSkills = Object.entries(xpLedger[f.id] || {})
                  .filter(([sid, xp]) => ((fighterSkillLevels[f.id]?.[sid] ?? 0) > 0) && (Number(xp) || 0) > 0)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 3)
                  .map(([sid]) => categories.flatMap(c => c.skills).find(s => s.id === sid)?.name || '')
                  .filter(Boolean);
                const titleName = f.callsign || f.name;
                const subName = f.fullName || '';
                const initials = (titleName || '??').split(/\s+/).map(x => x[0]).slice(0,2).join('').toUpperCase();
                return (
                  <div
                    key={f.id}
                    style={{
                      borderRadius: 18,
                      padding: 18,
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'grid',
                      gap: 12,
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-accent-lift)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--fg)' }}>
                        {initials}
                      </div>
                      <div style={{ display: 'grid', gap: 2, flex: 1 }}>
                        <strong style={{ fontSize: 16 }}>{titleName}</strong>
                        {subName && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{subName}</span>}
                        {(f.rank || f.position) && (
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {[f.rank, f.position].filter(Boolean).join(' • ')}
                          </span>
                        )}
                      </div>
                    </div>
                    {topSkills.filter(Boolean).length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {topSkills.filter(Boolean).map((n, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '3px 8px', background: 'var(--surface-accent-pill)', border: '1px solid var(--surface-accent-pill-border)', borderRadius: 999, color: 'var(--fg)' }}>{n}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                      <button
                        onClick={() => { setSelectedFighterId(f.id); setProfileOpen(true); }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 12,
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--surface-panel)',
                          color: 'var(--fg)'
                        }}
                      >Профіль</button>
                      <button
                        onClick={() => { if (confirm(`Видалити бійця «${f.callsign || f.name}»?`)) deleteFighter(f.id); }}
                        style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--danger-soft-bg)', border: '1px solid var(--danger-soft-border)', color: 'var(--fg)' }}
                      >Видалити</button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={handleCloseCreateModal}
        title="Створити бійця"
        width={820}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={handleCloseCreateModal}
              style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
            >Скасувати</button>
            <button
              onClick={() => {
                const fullName = name.trim();
                const callsign = callsignValue.trim();
                const rank = rankValue.trim();
                const position = positionValue.trim();
                const unit = unitValue.trim();
                const notes = notesValue.trim();

                if (!fullName || !callsign || !rank || !position || !unit) {
                  setFormError('Заповніть усі обов\'язкові поля.');
                  return;
                }

                setFormError(null);
                const display = callsign || fullName;
                addFighter(display, levels, { fullName, callsign, rank, position, unit, notes });
                setValuesToDefaults();
                setOpen(false);
              }}
              style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--success-soft-bg)', border: '1px solid var(--success-soft-border)', color: 'var(--fg)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}
            >
              Створити
            </button>
          </div>
        )}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {formError && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: 'var(--danger-soft-bg)',
              border: '1px solid var(--danger-soft-border)',
              color: 'var(--fg)',
              fontSize: 13,
              boxShadow: 'var(--shadow-sm)'
            }}>
              {formError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>ПІБ</span>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Прізвище Ім'я По батькові" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Позивний</span>
              <input value={callsignValue} onChange={e => setCallsignValue(e.target.value)} placeholder="Позивний" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Звання</span>
              <input value={rankValue} onChange={e => setRankValue(e.target.value)} placeholder="Звання" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Посада</span>
              <input value={positionValue} onChange={e => setPositionValue(e.target.value)} placeholder="Посада" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Підрозділ</span>
              <input value={unitValue} onChange={e => setUnitValue(e.target.value)} placeholder="Підрозділ" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
            </label>
            <label style={{ gridColumn: '1 / -1', display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Нотатки</span>
              <textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} placeholder="Додаткова інформація" rows={3} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
            </label>
          </div>
          <input
            placeholder="Пошук скіла"
            value={modalSearch}
            onChange={e => setModalSearch(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }}
          />
          <div style={{ maxHeight: 420, overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 12, background: 'var(--surface-panel)', display: 'grid', gap: 14 }}>
            {categories.map(cat => {
              const list = modalSearch.trim()
                ? cat.skills.filter(s => s.name.toLowerCase().includes(modalSearch.trim().toLowerCase()))
                : cat.skills;
              if (list.length === 0) return null;
              return (
                <div key={cat.id} style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</div>
                    <button onClick={() => setCollapsed(prev => ({ ...prev, ['modal_'+cat.id]: !prev['modal_'+cat.id] }))} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)', color: 'var(--fg)', fontSize: 12 }}>{collapsed['modal_'+cat.id] ? 'Розгорнути' : 'Згорнути'}</button>
                  </div>
                  {!collapsed['modal_'+cat.id] && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                      {list.map(s => (
                        <React.Fragment key={s.id}>
                          <div key={s.id + '-lbl'} style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>{s.name}</div>
                          <div key={s.id + '-seg'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <SegmentedLevelInput
                              value={(levels[s.id] ?? 0) as 0|1|2|3|4|5|6|7|8|9|10}
                              onChange={next => setLevels(prev => ({ ...prev, [s.id]: next }))}
                              size="sm"
                            />
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal open={profileOpen && !!selectedFighter} onClose={() => setProfileOpen(false)} title={`Профіль: ${selectedFighter?.name || ''}`} width={900}>
        {selectedFighter && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => {
                  const idx = fighters.findIndex(f => f.id === selectedFighter.id);
                  const prevIdx = (idx - 1 + fighters.length) % fighters.length;
                  setSelectedFighterId(fighters[prevIdx]?.id ?? selectedFighter.id);
                }}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', fontSize: 12 }}
              >← Попередній</button>
              <button
                onClick={() => {
                  const idx = fighters.findIndex(f => f.id === selectedFighter.id);
                  const nextIdx = (idx + 1) % fighters.length;
                  setSelectedFighterId(fighters[nextIdx]?.id ?? selectedFighter.id);
                }}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)', fontSize: 12 }}
              >Наступний →</button>
              <input placeholder="Пошук скіла" value={search} onChange={e => setSearch(e.target.value)} style={{ marginLeft: 'auto', padding: '10px 12px', borderRadius: 12, width: 260, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', color: 'var(--fg)' }} />
              <button onClick={() => { if (selectedFighter && confirm(`Видалити бійця «${selectedFighter.callsign || selectedFighter.name}»?`)) { deleteFighter(selectedFighter.id); setProfileOpen(false); } }} style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--danger-soft-bg)', border: '1px solid var(--danger-soft-border)', color: 'var(--fg)' }}>Видалити</button>
            </div>
            {/* Summary header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1px solid var(--border-subtle)', borderRadius: 14, background: 'var(--surface-card)' }}>
              {(() => {
                const topSkills = Object.entries(xpLedger[selectedFighter.id] || {})
                  .filter(([sid, xp]) => ((fighterSkillLevels[selectedFighter.id]?.[sid] ?? 0) > 0) && (Number(xp) || 0) > 0)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 3)
                  .map(([sid]) => categories.flatMap(c => c.skills).find(s => s.id === sid)?.name || '')
                  .filter(Boolean);
                return (
                  <>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Підсумок</span>
                    {(selectedFighter.rank || selectedFighter.position) && (
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {[selectedFighter.rank, selectedFighter.position].filter(Boolean).join(' • ')}
                      </span>
                    )}
                    {topSkills.length > 0 && (
                      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Топ:</span>
                        {topSkills.map((n, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '3px 8px', background: 'var(--surface-accent-pill)', border: '1px solid var(--surface-accent-pill-border)', borderRadius: 999 }}>{n}</span>
                        ))}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
            {filteredCategories.map((cat, catIndex) => (
              <div key={cat.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 14, background: 'var(--surface-panel)', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ flex: 1, fontSize: 15 }}>{cat.name}</strong>
                  <button onClick={() => setCollapsed(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-panel-alt)', color: 'var(--fg)', fontSize: 12 }}>{collapsed[cat.id] ? 'Розгорнути' : 'Згорнути'}</button>
                </div>
                {!collapsed[cat.id] && (
                  <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
                    {cat.skills.map((s, skillIndex) => {
                      const level = (fighterSkillLevels[selectedFighter.id]?.[s.id] ?? 0) as 0|1|2|3|4|5|6|7|8|9|10;
                      const xp = (xpLedger[selectedFighter.id]?.[s.id] ?? 0) as number;
                      const assigned = level > 0 || xp > 0;
                      const accents: Array<'blue' | 'teal' | 'violet'> = ['blue', 'teal', 'violet'];
                      const accent = accents[(catIndex + skillIndex) % accents.length];
                      return (
                        <SkillProgress
                          key={s.id}
                          name={s.name}
                          level={level}
                          xp={xp}
                          accent={accent}
                          disabled={!assigned}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
