interface SupplierOrderRow {
  id: string;
  locationName: string;
  items: { itemName: string; quantity: number }[];
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: string;
}

interface OrderTableProps {
  orders: SupplierOrderRow[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onConfirm: (id: string) => void;
}

export function OrderTable({ orders, selectedIds, onSelect, onConfirm }: OrderTableProps) {
  if (orders.length === 0) {
    return <p data-testid="empty-orders">No orders to display.</p>;
  }

  return (
    <table data-testid="order-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ padding: '8px', textAlign: 'left' }}></th>
          <th style={{ padding: '8px', textAlign: 'left' }}>Restaurant</th>
          <th style={{ padding: '8px', textAlign: 'left' }}>Items</th>
          <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
          <th style={{ padding: '8px', textAlign: 'left' }}>Created</th>
          <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td style={{ padding: '8px' }}>
              <input
                type="checkbox"
                checked={selectedIds.includes(order.id)}
                onChange={() => onSelect(order.id)}
              />
            </td>
            <td style={{ padding: '8px' }}>{order.locationName}</td>
            <td style={{ padding: '8px' }}>
              {order.items.map((item, i) => (
                <span key={i}>
                  {item.itemName} x{item.quantity}
                  {i < order.items.length - 1 ? ', ' : ''}
                </span>
              ))}
            </td>
            <td style={{ padding: '8px' }}>{order.status}</td>
            <td style={{ padding: '8px' }}>
              {new Date(order.createdAt).toLocaleDateString()}
            </td>
            <td style={{ padding: '8px' }}>
              {order.status === 'pending' && (
                <button onClick={() => onConfirm(order.id)}>Confirm</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
