import type { CSSProperties } from 'react';

export interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  completedBy?: string | null;
}

interface PrepChecklistProps {
  name: string;
  items: ChecklistItem[];
  onToggle: (itemId: string, isCompleted: boolean) => void;
}

export function PrepChecklist({ name, items, onToggle }: PrepChecklistProps) {
  const completedCount = items.filter((i) => i.isCompleted).length;
  const total = items.length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 100;
  const allComplete = completedCount === total;

  const containerStyle: CSSProperties = {
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: 'var(--ft-surface-elevated, #1E293B)',
    border: '1px solid var(--ft-border, #334155)',
  };

  const progressBarStyle: CSSProperties = {
    height: '4px',
    borderRadius: '2px',
    backgroundColor: 'var(--ft-border, #334155)',
    overflow: 'hidden',
    marginTop: '8px',
  };

  const progressFillStyle: CSSProperties = {
    height: '100%',
    width: `${percentage}%`,
    backgroundColor: allComplete
      ? 'var(--ft-status-healthy, #10B981)'
      : 'var(--ft-brand, #3B82F6)',
    transition: 'width 0.3s ease',
  };

  return (
    <div style={containerStyle} role="group" aria-label={`Prep checklist: ${name}`}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <strong style={{ fontSize: '0.875rem' }}>{name}</strong>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--ft-text-secondary, #9CA3AF)',
          }}
        >
          {completedCount}/{total} ({percentage}%)
        </span>
      </div>

      <div style={progressBarStyle}>
        <div style={progressFillStyle} />
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 0',
              borderBottom: '1px solid var(--ft-border, #334155)',
            }}
          >
            <input
              type="checkbox"
              checked={item.isCompleted}
              onChange={() => onToggle(item.id, !item.isCompleted)}
              aria-label={item.description}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: 'var(--ft-brand, #3B82F6)',
              }}
            />
            <span
              style={{
                fontSize: '0.875rem',
                textDecoration: item.isCompleted ? 'line-through' : 'none',
                opacity: item.isCompleted ? 0.6 : 1,
              }}
            >
              {item.description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
