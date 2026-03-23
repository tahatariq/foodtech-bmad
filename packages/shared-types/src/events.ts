/**
 * Typed WebSocket event wrapper for all FoodTech events.
 */
export interface FoodTechEvent<T> {
  event: string;
  payload: T;
  tenantId: string;
  timestamp: string;
  eventId: string;
}

/**
 * Event name constants for type-safe WebSocket communication.
 */
export const EventNames = {
  ORDER_CREATED: 'order.created',
  ORDER_STAGE_CHANGED: 'order.stage.changed',
  ORDER_COMPLETED: 'order.completed',
  ORDER_PICKED_UP: 'order.picked_up',
  INVENTORY_UPDATED: 'inventory.updated',
  INVENTORY_86D: 'inventory.86d',
  INVENTORY_REORDER_TRIGGERED: 'inventory.reorder.triggered',
  KITCHEN_STATUS_CHANGED: 'kitchen.status.changed',
  TEMPO_UPDATED: 'tempo.updated',
  SUPPLIER_ORDER_CONFIRMED: 'supplier.order.confirmed',
  SUPPLIER_ORDER_UPDATED: 'supplier.order.updated',
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];
