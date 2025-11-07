import React from 'react';

type Level = 0|1|2|3|4|5|6|7|8|9|10;

type Props = {
  value: Level;
  onChange: (next: Level) => void;
  maxLevel?: Level;
  accent?: 'blue' | 'teal' | 'violet';
  size?: 'sm' | 'md';
};

const accentMap = {
  blue: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 50%, #bfdbfe 100%)',
  teal: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 50%, #5eead4 100%)',
  violet: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c4b5fd 100%)'
};

export function SegmentedLevelInput({ value, onChange, maxLevel = 10 as Level, accent = 'teal', size = 'md' }: Props) {
  const segmentCount = 10;
  const segments = Array.from({ length: segmentCount }, (_, i) => i as Level);
  const palette = accentMap[accent] ?? accentMap.teal;
  const height = size === 'sm' ? 14 : 18;

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {segments.map(level => {
        const targetLevel = (level + 1) as Level;
        const active = value >= targetLevel;
        const handleClick = () => {
          if (value === targetLevel && value === targetLevel) {
            onChange(0 as Level);
          } else {
            onChange(targetLevel);
          }
        };
        return (
          <button
            key={level}
            onClick={handleClick}
            type="button"
            style={{
              width: height,
              height,
              borderRadius: 4,
              border: active ? '1px solid rgba(255,255,255,0.6)' : '1px solid rgba(148,163,184,0.35)',
              background: active ? palette : 'rgba(15, 23, 42, 0.55)',
              cursor: 'pointer',
              boxShadow: active ? '0 0 6px rgba(16,185,129,0.45)' : 'none',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease'
            }}
            aria-label={`Встановити рівень ${targetLevel}`}
          />
        );
      })}
    </div>
  );
}

export default SegmentedLevelInput;
