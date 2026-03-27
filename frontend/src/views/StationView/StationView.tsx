import { useState } from 'react';
import { KitchenTokenProvider } from '../../tokens/KitchenTokenProvider';
import { ConnectionIndicator, type ConnectionState } from '../../components/ConnectionIndicator';
import { TicketCard } from '../../components/kitchen/TicketCard';
import { BumpButton } from '../../components/kitchen/BumpButton';
import { useStationOrders } from './hooks/useStationOrders';
import { useBump } from './hooks/useBump';
import { useAuthStore } from '../../stores/authStore';
import { useOfflineStore } from '../../stores/offlineStore';

function SkeletonCard() {
  return (
    <div
      data-testid="skeleton-card"
      style={{
        backgroundColor: 'var(--ft-bg-surface, #2a2f38)',
        borderRadius: 'var(--ft-border-radius, 8px)',
        padding: 'var(--ft-padding-card, 24px)',
        minHeight: 120,
        opacity: 0.5,
        animation: 'ft-pulse-gentle 1.5s ease-in-out infinite',
      }}
    />
  );
}

function deriveConnectionState(
  isOffline: boolean,
  reconnectAttempts: number,
): ConnectionState {
  if (isOffline && reconnectAttempts > 0) return 'reconnecting';
  if (isOffline) return 'offline';
  return 'connected';
}

export function StationView() {
  const storeStationId = useAuthStore((s) => s.stationId);
  const [selectedStationId, setSelectedStationId] = useState(storeStationId);
  const activeStationId = selectedStationId ?? storeStationId;
  const { data: orders, isLoading } = useStationOrders(activeStationId);
  const bumpMutation = useBump(activeStationId);
  const isOffline = useOfflineStore((s) => s.isOffline);
  const reconnectAttempts = useOfflineStore((s) => s.reconnectAttempts);
  const queuedBumps = useOfflineStore((s) => s.queuedBumps);

  const connectionStatus = deriveConnectionState(isOffline, reconnectAttempts);

  return (
    <KitchenTokenProvider>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--ft-bg-primary)',
          color: 'var(--ft-text-primary)',
          fontFamily: 'var(--ft-font-primary)',
          padding: 'var(--ft-space-3, 16px)',
          overflowX: 'hidden',
          maxWidth: '100vw',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--ft-space-4, 24px)',
          }}
        >
          <select
            data-testid="station-selector"
            value={activeStationId ?? ''}
            onChange={(e) => setSelectedStationId(e.target.value || null)}
            aria-label="Select station"
            style={{
              minHeight: 'var(--ft-target-size, 48px)',
              backgroundColor: 'var(--ft-bg-surface)',
              color: 'var(--ft-text-primary)',
              border: '1px solid var(--ft-border-default)',
              borderRadius: 'var(--ft-border-radius)',
              padding: '0 var(--ft-space-3)',
              fontSize: 'var(--ft-font-size-body)',
            }}
          >
            <option value="">Select station...</option>
          </select>

          <ConnectionIndicator status={connectionStatus} />
        </div>

        {isLoading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ft-gap-default, 16px)',
              maxWidth: '48rem',
              margin: '0 auto',
              width: '100%',
            }}
          >
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!isLoading && (!orders || orders.length === 0) && (
          <div
            data-testid="empty-state"
            role="status"
            style={{
              textAlign: 'center',
              padding: 'var(--ft-space-8, 64px) var(--ft-space-4)',
              color: 'var(--ft-text-muted)',
              fontSize: 'var(--ft-font-size-body)',
            }}
          >
            No tickets right now. Orders will appear here automatically.
          </div>
        )}

        {!isLoading && orders && orders.length > 0 && (
          <div
            aria-live="polite"
            aria-label={`${orders.length} ticket${orders.length !== 1 ? 's' : ''} in queue`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ft-gap-default, 16px)',
              maxWidth: '48rem',
              margin: '0 auto',
              width: '100%',
            }}
          >
            {orders.map((order) => {
              const isQueued = queuedBumps.some(
                (b) => b.orderId === order.id,
              );
              return (
                <div key={order.id}>
                  <TicketCard
                    order={order}
                    variant="station"
                    offlineQueued={isQueued}
                  />
                  <BumpButton
                    orderNumber={order.orderNumber}
                    nextStageName="next"
                    onClick={() => bumpMutation.mutate(order.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </KitchenTokenProvider>
  );
}
