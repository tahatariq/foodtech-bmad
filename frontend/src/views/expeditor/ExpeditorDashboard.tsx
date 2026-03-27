import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KitchenTokenProvider } from '../../tokens/KitchenTokenProvider';
import { ConnectionIndicator } from '../../components/ConnectionIndicator';
import { RailPanel } from './panels/RailPanel';
import { KitchenStatusPanel } from './panels/KitchenStatusPanel';
import { TempoPanel } from './panels/TempoPanel';
import {
  getAllOrders,
  getStationStatuses,
  get86dItems,
  getTempo,
} from '../../api/orders.api';

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1.4fr 1fr',
  height: 'calc(100vh - 48px)',
  gap: '1px',
  backgroundColor: 'var(--ft-border, #334155)',
};

const panelStyle: CSSProperties = {
  backgroundColor: 'var(--ft-surface, #0F172A)',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  height: '48px',
  padding: '0 16px',
  backgroundColor: 'var(--ft-surface-elevated, #1E293B)',
  borderBottom: '1px solid var(--ft-border, #334155)',
};

export function ExpeditorDashboard() {
  const ordersQuery = useQuery({
    queryKey: ['orders', 'all'],
    queryFn: getAllOrders,
    refetchInterval: 30000,
  });

  const stationsQuery = useQuery({
    queryKey: ['station-statuses'],
    queryFn: getStationStatuses,
    refetchInterval: 15000,
  });

  const eightySixQuery = useQuery({
    queryKey: ['86d-items'],
    queryFn: get86dItems,
    refetchInterval: 15000,
  });

  const tempoQuery = useQuery({
    queryKey: ['tempo'],
    queryFn: getTempo,
    refetchInterval: 10000,
  });

  const isLoading =
    ordersQuery.isLoading ||
    stationsQuery.isLoading ||
    tempoQuery.isLoading;

  const activeOrders = (ordersQuery.data ?? []).filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled',
  );

  const isEmpty = !isLoading && activeOrders.length === 0;

  return (
    <KitchenTokenProvider>
      <div style={headerStyle}>
        <strong style={{ fontSize: '1rem' }}>Expeditor Dashboard</strong>
        <ConnectionIndicator status="connected" />
      </div>

      {isEmpty ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 48px)',
            color: 'var(--ft-text-secondary, #9CA3AF)',
            gap: '16px',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>
            All clear. Kitchen is idle.
          </span>
          <TempoPanel tempo={tempoQuery.data ?? null} isLoading={false} />
        </div>
      ) : (
        <div style={gridStyle}>
          <div style={panelStyle}>
            <RailPanel orders={activeOrders} isLoading={ordersQuery.isLoading} />
          </div>
          <div style={panelStyle}>
            <KitchenStatusPanel
              stations={stationsQuery.data ?? []}
              eightySixedItems={eightySixQuery.data ?? []}
              isLoading={stationsQuery.isLoading}
            />
          </div>
          <div style={panelStyle}>
            <TempoPanel
              tempo={tempoQuery.data ?? null}
              isLoading={tempoQuery.isLoading}
            />
          </div>
        </div>
      )}
    </KitchenTokenProvider>
  );
}
