import { useState, useEffect, type CSSProperties } from 'react';
import { AttentionWrapper } from '../../AttentionWrapper';
import { useAttention } from '../../../hooks/useAttention';
import { ProgressTimeline } from './ProgressTimeline';
import { Badge86 } from '../../Badge86';
import type { Order } from '../../../api/orders.api';
import { formatMs } from '../../../utils/formatTime';

interface TicketCardProps {
  order: Order;
  variant?: 'station' | 'expeditor' | 'rail';
  expectedDurationMinutes?: number;
  warningThresholdMinutes?: number;
  criticalThresholdMinutes?: number;
  eightySixedItems?: Set<string>;
  offlineQueued?: boolean;
}

const variantStyles: Record<string, CSSProperties> = {
  station: {
    padding: 'var(--ft-padding-card, 24px)',
    fontSize: 'var(--ft-font-size-body, 18px)',
  },
  expeditor: { padding: '12px', fontSize: '14px' },
  rail: { padding: '8px', fontSize: '12px' },
};

export function TicketCard({
  order,
  variant = 'station',
  expectedDurationMinutes = 10,
  warningThresholdMinutes = 5,
  criticalThresholdMinutes = 8,
  eightySixedItems,
  offlineQueued = false,
}: TicketCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const stageEnteredAt = order.stageEnteredAt ?? order.createdAt;
  const elapsedMs = now - new Date(stageEnteredAt).getTime();
  const attentionLevel = useAttention(elapsedMs, {
    warningMs: warningThresholdMinutes * 60_000,
    criticalMs: criticalThresholdMinutes * 60_000,
  });

  return (
    <AttentionWrapper level={attentionLevel}>
      <div
        role="article"
        aria-label={`Order ${order.orderNumber}, ${order.status}, ${formatMs(elapsedMs)} elapsed`}
        data-testid="ticket-card"
        tabIndex={0}
        style={{
          backgroundColor: 'var(--ft-bg-surface, #2a2f38)',
          color: 'var(--ft-text-primary, #f1f3f5)',
          borderRadius: 'var(--ft-border-radius, 8px)',
          position: 'relative',
          ...variantStyles[variant],
        }}
      >
        {offlineQueued && (
          <span
            data-testid="offline-indicator"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#F59E0B',
            }}
            aria-label="Queued offline"
          />
        )}

        <div
          style={{
            fontFamily: 'var(--ft-font-mono)',
            fontSize: variant === 'station' ? '1.5rem' : '1.125rem',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            marginBottom: '8px',
          }}
          data-testid="order-number"
        >
          #{order.orderNumber}
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px 0' }}>
          {order.items.map((item) => (
            <li key={item.id} data-testid="order-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span>
                {item.quantity}x {item.itemName}
              </span>
              {eightySixedItems?.has(item.itemName) && (
                <Badge86 itemName={item.itemName} />
              )}
            </li>
          ))}
        </ul>

        <ProgressTimeline
          stageEnteredAt={stageEnteredAt}
          expectedDurationMinutes={expectedDurationMinutes}
          warningThresholdMinutes={warningThresholdMinutes}
          criticalThresholdMinutes={criticalThresholdMinutes}
          elapsedMs={elapsedMs}
        />
      </div>
    </AttentionWrapper>
  );
}
