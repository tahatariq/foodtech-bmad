import { OrderTable } from '../components/OrderTable';
import { BatchActionBar } from '../components/BatchActionBar';

export function OrdersView() {
  return (
    <div>
      <h1>Orders</h1>
      <OrderTable orders={[]} selectedIds={[]} onSelect={() => {}} onConfirm={() => {}} />
      <BatchActionBar
        selectedCount={0}
        onBatchConfirm={() => {}}
        onBatchRoute={() => {}}
      />
    </div>
  );
}
