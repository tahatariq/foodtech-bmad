import type { Order } from '../../../api/orders.api';
import { TicketCard } from '../../../components/kitchen/TicketCard/TicketCard';

interface RailPanelProps {
  orders: Order[];
  isLoading: boolean;
}

export function RailPanel({ orders, isLoading }: RailPanelProps) {
  if (isLoading) {
    return (
      <div aria-label="The Rail" style={{ padding: '12px' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '80px',
              backgroundColor: 'var(--ft-border, #334155)',
              borderRadius: '8px',
              marginBottom: '8px',
              animation: 'ft-pulse-gentle 2s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        aria-label="The Rail"
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--ft-text-secondary, #9CA3AF)',
        }}
      >
        No active orders
      </div>
    );
  }

  return (
    <div
      aria-label="The Rail"
      style={{ padding: '8px', overflowY: 'auto', height: '100%' }}
    >
      {orders.map((order) => (
        <div key={order.id} style={{ marginBottom: '8px' }}>
          <TicketCard order={order} />
        </div>
      ))}
    </div>
  );
}
