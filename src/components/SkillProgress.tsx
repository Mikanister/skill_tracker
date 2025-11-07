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
    fill: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 60%, #93c5fd 100%)',
    glow: '0 0 8px rgba(96,165,250,0.45)'
  },
  teal: {
    fill: 'linear-gradient(90deg, #14b8a6 0%, #2dd4bf 60%, #5eead4 100%)',
    glow: '0 0 8px rgba(45,212,191,0.35)'
  },
  violet: {
    fill: 'linear-gradient(90deg, #a855f7 0%, #c084fc 60%, #d8b4fe 100%)',
    glow: '0 0 8px rgba(168,85,247,0.35)'
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
        border: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(12, 18, 34, 0.45)',
        boxShadow: showProgress && clampedProgress > 0 ? palette.glow : 'none',
        opacity: disabled ? 0.55 : 1,
        transition: 'box-shadow 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, fontWeight: 600 }}>{name}</div>
        <div style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 999,
          background: 'rgba(17,24,39,0.8)',
          border: '1px solid rgba(148,163,184,0.3)'
        }}>
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
                border: '1px solid rgba(148,163,184,0.35)',
                background: 'rgba(30,41,59,0.6)',
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
        <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.6)', textAlign: 'right', fontStyle: 'italic' }}>Не призначено</div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(226,232,240,0.7)' }}>
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
