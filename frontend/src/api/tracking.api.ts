const API_BASE = '/api/v1';

export interface TrackingOrderData {
  orderId: string;
  orderNumber: string;
  status: string;
  items: { itemName: string; stage: string; quantity: number }[];
  createdAt: string;
}

export interface TrackingResponse {
  expired: false;
  orderId: string;
  orderNumber: string;
  status: string;
  items: { itemName: string; stage: string; quantity: number }[];
  createdAt: string;
}

export interface TrackingExpiredResponse {
  error: 'expired';
  message: string;
}

export type TrackingResult = TrackingResponse | TrackingExpiredResponse;

export async function getOrderByToken(token: string): Promise<TrackingResult> {
  const res = await fetch(`${API_BASE}/track/${token}`);
  if (!res.ok) throw new Error(`Tracking error: ${res.status}`);
  return res.json();
}
