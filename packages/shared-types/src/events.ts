/**
 * Typed WebSocket event wrapper for all FoodTech events.
 */
export interface FoodTechEvent<T = unknown> {
  event: string;
  payload: T;
  tenantId: string;
  timestamp: string; // ISO 8601
  eventId: string; // UUID v4
}

/**
 * Event name constants organized by domain.
 */
export const ORDER_EVENTS = {
  CREATED: 'order.created',
  STAGE_CHANGED: 'order.stage.changed',
  BUMPED: 'order.bumped',
  COMPLETED: 'order.completed',
  VOIDED: 'order.voided',
} as const;

export const STATION_EVENTS = {
  UPDATED: 'station.updated',
  LOAD_CHANGED: 'station.load.changed',
} as const;

export const INVENTORY_EVENTS = {
  LEVEL_CHANGED: 'inventory.level.changed',
  EIGHTY_SIXED: 'inventory.86d',
  UN_EIGHTY_SIXED: 'inventory.un86d',
} as const;

export const KITCHEN_EVENTS = {
  STATUS_CHANGED: 'kitchen.status.changed',
} as const;

export const SYSTEM_EVENTS = {
  CONNECTION_STATUS: 'system.connection.status',
  STATE_SYNC: 'system.state.sync',
} as const;

export const SUPPLIER_EVENTS = {
  ORDER_CONFIRMED: 'supplier.order.confirmed',
  ORDER_UPDATED: 'supplier.order.updated',
} as const;

/** Combined EventNames for backwards compatibility */
export const EventNames = {
  ORDER_CREATED: ORDER_EVENTS.CREATED,
  ORDER_STAGE_CHANGED: ORDER_EVENTS.STAGE_CHANGED,
  ORDER_COMPLETED: ORDER_EVENTS.COMPLETED,
  ORDER_PICKED_UP: 'order.picked_up',
  INVENTORY_UPDATED: INVENTORY_EVENTS.LEVEL_CHANGED,
  INVENTORY_86D: INVENTORY_EVENTS.EIGHTY_SIXED,
  INVENTORY_REORDER_TRIGGERED: 'inventory.reorder.triggered',
  KITCHEN_STATUS_CHANGED: 'kitchen.status.changed',
  TEMPO_UPDATED: 'tempo.updated',
  SUPPLIER_ORDER_CONFIRMED: SUPPLIER_EVENTS.ORDER_CONFIRMED,
  SUPPLIER_ORDER_UPDATED: SUPPLIER_EVENTS.ORDER_UPDATED,
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];

/**
 * Room name constants and helpers.
 */
export const EXPEDITOR_ROOM = 'expeditor';
export const DELIVERY_ROOM = 'delivery';

export function getTenantNamespace(tenantId: string): string {
  return `/tenant-${tenantId}`;
}

export function getStationRoom(stationId: string): string {
  return `station:${stationId}`;
}

export function getCustomerRoom(orderId: string): string {
  return `customer:${orderId}`;
}

export function getSupplierRoom(supplierId: string): string {
  return `supplier:${supplierId}`;
}
