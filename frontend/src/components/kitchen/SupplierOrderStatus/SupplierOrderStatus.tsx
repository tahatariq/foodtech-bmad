import type { CSSProperties } from 'react';
import { AttentionWrapper } from '../../AttentionWrapper';
import type { SupplierOrder } from '../../../api/orders.api';

interface SupplierOrderStatusProps {
  orders: SupplierOrder[];
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

const statusBadgeColors: Record<SupplierOrder['status'], { bg: string; text: string }> = {
  pending: { bg: '#6B7280', text: '#FFFFFF' },
  confirmed: { bg: '#3B82F6', text: '#FFFFFF' },
  shipped: { bg: '#F59E0B', text: '#000000' },
  delivered: { bg: '#10B981', text: '#FFFFFF' },
};

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
};

const cardStyle: CSSProperties = {
  padding: '12px',
  borderRadius: '6px',
  backgroundColor: 'var(--ft-surface-elevated, #1E293B)',
  border: '1px solid var(--ft-border, #334155)',
};

const badgeStyle = (status: SupplierOrder['status']): CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: statusBadgeColors[status].bg,
  color: statusBadgeColors[status].text,
});

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

function getHoursAgo(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
}

function isPendingTooLong(order: SupplierOrder): boolean {
  return (
    order.status === 'pending' &&
    Date.now() - new Date(order.createdAt).getTime() > FOUR_HOURS_MS
  );
}

function OrderCard({ order }: { order: SupplierOrder }) {
  const hoursAgo = getHoursAgo(order.createdAt);

  const content = (
    <div style={cardStyle} data-testid="supplier-order-card">
      <div style={headerStyle}>
        <strong>{order.supplierName}</strong>
        <span style={badgeStyle(order.status)} data-testid="status-badge">
          {order.status}
        </span>
      </div>
      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.875rem' }}>
        {order.items.map((item, idx) => (
          <li key={idx}>
            {item.itemName} x{item.quantity}
          </li>
        ))}
      </ul>
      {order.expectedDelivery && (order.status === 'confirmed' || order.status === 'shipped') && (
        <div
          style={{ fontSize: '0.75rem', color: 'var(--ft-text-secondary, #9CA3AF)', marginTop: '4px' }}
          data-testid="expected-delivery"
        >
          Expected: {new Date(order.expectedDelivery).toLocaleString()}
        </div>
      )}
      {isPendingTooLong(order) && (
        <div
          style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '4px' }}
          data-testid="unconfirmed-label"
        >
          Unconfirmed — {Math.floor(hoursAgo)}h ago
        </div>
      )}
    </div>
  );

  if (isPendingTooLong(order)) {
    return <AttentionWrapper level="warning">{content}</AttentionWrapper>;
  }

  return content;
}

export function SupplierOrderStatus({ orders }: SupplierOrderStatusProps) {
  if (orders.length === 0) {
    return (
      <div style={{ padding: '12px', color: 'var(--ft-text-secondary, #9CA3AF)' }}>
        No active supplier orders
      </div>
    );
  }

  return (
    <div style={containerStyle} data-testid="supplier-order-status">
      <h3 style={{ margin: '0 0 4px 0', fontSize: '0.875rem' }}>
        Supplier Orders ({orders.length})
      </h3>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
