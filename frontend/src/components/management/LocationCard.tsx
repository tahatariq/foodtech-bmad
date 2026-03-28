type TempoStatus = 'green' | 'amber' | 'red';

interface LocationCardProps {
  name: string;
  tempoStatus: TempoStatus;
  orderCount: number;
  staffCount: number;
  onClick?: () => void;
}

const TEMPO_COLORS: Record<TempoStatus, string> = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
};

const TEMPO_LABELS: Record<TempoStatus, string> = {
  green: 'On Track',
  amber: 'Slowing',
  red: 'Behind',
};

export function LocationCard({
  name,
  tempoStatus,
  orderCount,
  staffCount,
  onClick,
}: LocationCardProps) {
  return (
    <div
      data-testid="location-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span
          data-testid="tempo-indicator"
          data-tempo={tempoStatus}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: TEMPO_COLORS[tempoStatus],
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <h3 data-testid="location-name" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          {name}
        </h3>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}>
        <span data-testid="order-count">Orders: {orderCount}</span>
        <span data-testid="staff-count">Staff: {staffCount}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: TEMPO_COLORS[tempoStatus] }}>
        {TEMPO_LABELS[tempoStatus]}
      </div>
    </div>
  );
}
