import { CSSProperties } from 'react';

export const surfaceCard: CSSProperties = {
  borderRadius: 18,
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-card)',
  boxShadow: 'var(--shadow-md)'
};

export const surfacePanel: CSSProperties = {
  borderRadius: 18,
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-panel)',
  boxShadow: 'var(--shadow-md)'
};

export const dangerSurface: CSSProperties = {
  borderRadius: 18,
  border: '1px solid var(--danger-soft-border)',
  background: 'var(--surface-danger-soft)',
  boxShadow: 'var(--shadow-md)'
};

export const buttonPrimary: CSSProperties = {
  padding: '12px 18px',
  borderRadius: 14,
  background: 'var(--accent-soft-bg)',
  border: '1px solid var(--accent-soft-border)',
  color: 'var(--fg)',
  fontWeight: 600,
  letterSpacing: '0.01em',
  boxShadow: 'var(--shadow-sm)'
};

export const buttonSecondary: CSSProperties = {
  padding: '12px 18px',
  borderRadius: 14,
  background: 'var(--surface-panel-alt)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--fg)',
  fontWeight: 600,
  boxShadow: 'var(--shadow-sm)'
};

export const buttonDanger: CSSProperties = {
  padding: '12px 18px',
  borderRadius: 14,
  background: 'var(--danger-soft-bg)',
  border: '1px solid var(--danger-soft-border)',
  color: 'var(--fg)',
  fontWeight: 600,
  boxShadow: 'var(--shadow-sm)'
};

export const badgePill = (background: string, border: string, color = 'var(--fg)'): CSSProperties => ({
  padding: '2px 8px',
  borderRadius: 999,
  background,
  border,
  color,
  fontSize: 11,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
});

export const mergeStyles = (base: CSSProperties, overrides?: CSSProperties): CSSProperties => ({
  ...base,
  ...(overrides ?? {})
});
