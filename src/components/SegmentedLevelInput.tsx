import React from 'react';
import clsx from 'clsx';

type Level = 0|1|2|3|4|5|6|7|8|9|10;

type Accent = 'blue' | 'teal' | 'violet';
type Size = 'sm' | 'md';

type Props = {
  value: Level;
  onChange: (next: Level) => void;
  maxLevel?: Level;
  accent?: Accent;
  size?: Size;
  disabled?: boolean;
};

const SEGMENT_COUNT = 10;

export function SegmentedLevelInput({
  value,
  onChange,
  maxLevel = 10 as Level,
  accent = 'teal',
  size = 'md',
  disabled = false
}: Props) {
  const segments = React.useMemo(() => Array.from({ length: SEGMENT_COUNT }, (_, i) => i as Level), []);

  const handleSegmentClick = (targetLevel: Level) => {
    if (disabled) return;
    const next = value === targetLevel ? (0 as Level) : targetLevel;
    onChange(next); // parent should clamp if maxLevel < SEGMENT_COUNT
  };

  return (
    <div className={clsx(
      'segmented-level',
      `segmented-level--${size}`,
      `segmented-level--accent-${accent}`
    )}>
      {segments.map((level) => {
        const targetLevel = (level + 1) as Level;
        const isActive = value >= targetLevel && targetLevel <= maxLevel;
        return (
          <button
            key={level}
            type="button"
            className={clsx('segmented-level__segment', { 'is-active': isActive })}
            onClick={() => handleSegmentClick(targetLevel)}
            aria-label={`Встановити рівень ${targetLevel}`}
            aria-pressed={isActive}
            disabled={disabled || targetLevel > maxLevel}
          />
        );
      })}
    </div>
  );
}

export default SegmentedLevelInput;
