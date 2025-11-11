import React from 'react';
import { Category, Fighter, FighterSkillLevels } from '@/types';

type FighterCardProps = {
  fighter: Fighter;
  categories: Category[];
  fighterSkillLevels: Record<string, FighterSkillLevels>;
  xpLedger: Record<string, Record<string, number>>;
  tasksSummary: { inProgress: number; validation: number };
  onOpenProfile: (fighterId: string) => void;
};

export const FighterCard: React.FC<FighterCardProps> = ({
  fighter,
  categories,
  fighterSkillLevels,
  xpLedger,
  tasksSummary,
  onOpenProfile
}) => {
  const topSkills = React.useMemo(() => {
    const ledger = xpLedger[fighter.id] || {};
    return Object.entries(ledger)
      .filter(([skillId]) => (fighterSkillLevels[fighter.id]?.[skillId] ?? 0) > 0)
      .sort(([, xpA], [, xpB]) => (xpB ?? 0) - (xpA ?? 0))
      .slice(0, 3)
      .map(([skillId]) => categories.flatMap(category => category.skills).find(skill => skill.id === skillId)?.name || '')
      .filter(Boolean);
  }, [categories, fighter.id, fighterSkillLevels, xpLedger]);

  const initials = React.useMemo(() => (fighter.callsign || fighter.name || '??')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase(), [fighter.callsign, fighter.name]);

  const rankLine = [fighter.rank, fighter.position].filter(Boolean).join(' • ');

  return (
    <div
      onClick={() => onOpenProfile(fighter.id)}
      style={{
        borderRadius: 18,
        padding: 18,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        display: 'grid',
        gap: 12,
        boxShadow: 'var(--shadow-lg)',
        cursor: 'pointer'
      }}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenProfile(fighter.id);
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-accent-lift)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--fg)' }}>
          {initials}
        </div>
        <div style={{ display: 'grid', gap: 3, flex: 1 }}>
          <strong style={{ fontSize: 16, color: 'var(--fg)' }}>{fighter.callsign || fighter.name}</strong>
          {fighter.fullName && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fighter.fullName}</span>}
          {rankLine && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{rankLine}</span>}
        </div>
        {(tasksSummary.inProgress > 0 || tasksSummary.validation > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {tasksSummary.inProgress > 0 && (
              <span data-testid={`fighter-badge-in-progress-${fighter.id}`} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'var(--surface-accent-pill)', border: '1px solid var(--surface-accent-pill-border)', color: 'var(--fg)' }}>
                🔧 {tasksSummary.inProgress}
              </span>
            )}
            {tasksSummary.validation > 0 && (
              <span data-testid={`fighter-badge-validation-${fighter.id}`} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'var(--surface-danger-soft)', border: '1px solid var(--danger-soft-border)', color: 'var(--fg)' }}>
                ✅ {tasksSummary.validation}
              </span>
            )}
          </div>
        )}
      </div>

      {topSkills.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {topSkills.map((name, index) => (
            <span key={`${fighter.id}-${name}-${index}`} style={{ fontSize: 11, padding: '3px 8px', background: 'var(--surface-accent-pill)', border: '1px solid var(--surface-accent-pill-border)', borderRadius: 999, color: 'var(--fg)' }}>
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
