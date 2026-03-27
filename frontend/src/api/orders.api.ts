import { useAuthStore } from '../stores/authStore';

const API_BASE = '/api/v1';

async function fetchWithAuth(url: string, options?: RequestInit) {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface OrderItem {
  id: string;
  itemName: string;
  stationId: string;
  stage: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  createdAt: string;
  stageEnteredAt?: string;
  _offlineQueued?: boolean;
}

export async function getOrdersByStation(
  stationId: string,
): Promise<Order[]> {
  return fetchWithAuth(`${API_BASE}/orders?stationId=${stationId}`);
}

export async function bumpOrder(orderId: string): Promise<Order> {
  return fetchWithAuth(`${API_BASE}/orders/${orderId}/bump`, {
    method: 'POST',
  });
}

export async function getStations(): Promise<
  { id: string; name: string; emoji?: string; displayOrder: number }[]
> {
  return fetchWithAuth(`${API_BASE}/stations`);
}

export async function getAllOrders(): Promise<Order[]> {
  return fetchWithAuth(`${API_BASE}/orders`);
}

export interface StationStatus {
  stationId: string;
  stationName: string;
  stationEmoji?: string | null;
  status: 'green' | 'yellow' | 'red';
  statusColor: string;
  statusText: string;
  ticketCount: number;
  checklistCompletion: number;
}

export async function getStationStatuses(): Promise<StationStatus[]> {
  return fetchWithAuth(`${API_BASE}/kitchen-status/stations`);
}

export interface InventoryItem86d {
  id: string;
  item_name: string;
  is_86d: boolean;
}

export async function get86dItems(): Promise<InventoryItem86d[]> {
  return fetchWithAuth(`${API_BASE}/inventory-items/86d`);
}

export interface TempoData {
  tempoValue: number;
  status: 'green' | 'amber' | 'red';
  stationBreakdown: {
    stationId: string;
    stationName: string;
    avgTime: number;
    ticketCount: number;
    status: 'green' | 'amber' | 'red';
  }[];
  target: number;
  calculatedAt: string;
}

export async function getTempo(): Promise<TempoData> {
  return fetchWithAuth(`${API_BASE}/tempo`);
}
