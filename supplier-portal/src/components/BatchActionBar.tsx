interface BatchActionBarProps {
  selectedCount: number;
  onBatchConfirm: () => void;
  onBatchRoute: () => void;
}

export function BatchActionBar({
  selectedCount,
  onBatchConfirm,
  onBatchRoute,
}: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      data-testid="batch-action-bar"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 24px',
        borderRadius: '8px',
        backgroundColor: '#1E293B',
        border: '1px solid #334155',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 50,
      }}
    >
      <span>{selectedCount} selected</span>
      <button onClick={onBatchConfirm}>Confirm All</button>
      <button onClick={onBatchRoute}>Route Delivery</button>
    </div>
  );
}
