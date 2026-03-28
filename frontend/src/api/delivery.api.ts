export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: string;
  items: { itemName: string; quantity: number }[];
  createdAt: string;
  etaMinutes: number;
}

export async function getDeliveryOrders(apiKey: string): Promise<DeliveryOrder[]> {
  const res = await fetch('/api/v1/delivery/orders', {
    headers: { 'X-API-Key': apiKey },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function pickupDeliveryOrder(apiKey: string, orderId: string): Promise<void> {
  const res = await fetch(`/api/v1/delivery/orders/${orderId}/pickup`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}
