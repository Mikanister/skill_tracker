type Props = {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function EmptyState({ icon = '📭', title, description, action }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
      color: 'var(--muted)'
    }}>
      <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.5 }}>{icon}</div>
      <h3 style={{ margin: '0 0 8px', color: 'var(--fg)' }}>{title}</h3>
      {description && (
        <p style={{ margin: '0 0 24px', maxWidth: 400 }}>{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
