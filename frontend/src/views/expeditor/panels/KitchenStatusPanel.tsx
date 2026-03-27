import { useState } from 'react';
import type { StationStatus, InventoryItem86d } from '../../../api/orders.api';
import { StationStatusIndicator } from '../../../components/StationStatusIndicator/StationStatusIndicator';
import { Badge86 } from '../../../components/kitchen/Badge86/Badge86';

interface KitchenStatusPanelProps {
  stations: StationStatus[];
  eightySixedItems: InventoryItem86d[];
  isLoading: boolean;
}

export function KitchenStatusPanel({
  stations,
  eightySixedItems,
  isLoading,
}: KitchenStatusPanelProps) {
  const [expandedStationId, setExpandedStationId] = useState<string | null>(
    null,
  );

  if (isLoading) {
    return (
      <div aria-label="Kitchen Status" style={{ padding: '12px' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '40px',
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

  return (
    <div
      aria-label="Kitchen Status"
      style={{ padding: '8px', overflowY: 'auto', height: '100%' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px',
        }}
      >
        {stations.map((station) => (
          <StationStatusIndicator
            key={station.stationId}
            stationName={station.stationName}
            stationEmoji={station.stationEmoji}
            status={station.status}
            ticketCount={station.ticketCount}
            expanded={expandedStationId === station.stationId}
            onClick={() =>
              setExpandedStationId(
                expandedStationId === station.stationId
                  ? null
                  : station.stationId,
              )
            }
          />
        ))}
      </div>

      {eightySixedItems.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <strong
            style={{
              fontSize: '0.75rem',
              color: 'var(--ft-text-secondary, #9CA3AF)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            86 Board
          </strong>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            {eightySixedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <Badge86 itemName={item.item_name} size="md" />
                <span style={{ fontSize: '0.75rem' }}>{item.item_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
