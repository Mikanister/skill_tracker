import React from 'react';
import { xpThresholdForLevel } from '@/utils';

interface SkillProgressProps {
  name: string;
  level: 0|1|2|3|4|5|6|7|8|9|10;
  xp: number;
  maxLevel?: 0|1|2|3|4|5|6|7|8|9|10;
  accent?: 'blue' | 'teal' | 'violet';
  compact?: boolean;
  disabled?: boolean;
}

const accentPalettes = {
  blue: {
    fill: 'var(--skill-progress-fill-blue)',
    glow: 'var(--skill-progress-glow-blue)'
  },
  teal: {
    fill: 'var(--skill-progress-fill-teal)',
    glow: 'var(--skill-progress-glow-teal)'
  },
  violet: {
    fill: 'var(--skill-progress-fill-violet)',
    glow: 'var(--skill-progress-glow-violet)'
  }
};

export function SkillProgress({ name, level, xp, maxLevel = 10, accent = 'blue', compact, disabled }: SkillProgressProps) {
  const palette = accentPalettes[accent] ?? accentPalettes.blue;
  const cappedLevel = Math.min(level, maxLevel) as 0|1|2|3|4|5|6|7|8|9|10;
  const currentThreshold = xpThresholdForLevel(cappedLevel);
  const nextLevel = cappedLevel >= maxLevel ? maxLevel : (cappedLevel + 1) as 0|1|2|3|4|5|6|7|8|9|10;
  const nextThreshold = xpThresholdForLevel(nextLevel);

  const delta = Math.max(nextThreshold - currentThreshold, 1);
  const rawProgress = xp - currentThreshold;
  const clampedProgress = cappedLevel >= maxLevel ? 1 : Math.max(0, Math.min(rawProgress / delta, 1));
  const percent = Math.round(clampedProgress * 100);
  const xpToNext = cappedLevel >= maxLevel ? 0 : Math.max(0, nextThreshold - xp);
  const maxedOut = cappedLevel >= maxLevel;
  const showProgress = !disabled;
  const segments = Array.from({ length: 10 }, (_, i) => i);
  const segmentFill = (segmentIndex: number) => {
    if (!showProgress) return 0;
    if (segmentIndex < cappedLevel) return 1;
    if (segmentIndex > cappedLevel) return 0;
    if (maxedOut) return 1;
    return Math.min(clampedProgress, 1);
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: compact ? 4 : 6,
        padding: compact ? '4px 0' : '6px 0',
        borderRadius: 10,
        border: '1px solid var(--skill-progress-frame-border)',
        background: 'var(--skill-progress-surface)',
        boxShadow: showProgress && clampedProgress > 0 ? palette.glow : 'none',
        opacity: disabled ? 0.55 : 1,
        transition: 'box-shadow 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, fontWeight: 600 }}>{name}</div>
        <div
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 999,
            background: 'var(--skill-progress-badge)',
            border: '1px solid var(--skill-progress-border-strong)'
          }}
        >
          lvl {cappedLevel}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: compact ? 3 : 4, marginTop: compact ? 0 : 2 }}>
        {segments.map(index => {
          const fill = segmentFill(index);
          return (
            <div
              key={index}
              style={{
                height: compact ? 12 : 16,
                borderRadius: 4,
                border: '1px solid var(--skill-progress-border)',
                background: 'var(--skill-progress-inner)',
                overflow: 'hidden',
                boxShadow: fill > 0 ? palette.glow : 'none'
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: '100%',
                  background: palette.fill,
                  transition: 'width 0.25s ease'
                }}
              />
            </div>
          );
        })}
      </div>
      {disabled ? (
        <div style={{ fontSize: 11, color: 'var(--skill-progress-text-disabled)', textAlign: 'right', fontStyle: 'italic' }}>Не призначено</div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--skill-progress-text-muted)' }}>
          <span>{xp} XP</span>
          {maxedOut ? (
            <span>MAX рівень</span>
          ) : (
            <span>{xpToNext} XP до lvl {Math.min(maxLevel, cappedLevel + 1)}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default SkillProgress;
