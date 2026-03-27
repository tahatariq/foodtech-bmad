import {
  pgTable,
  text,
  integer,
  index,
  unique,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { primaryId, timestamps } from '../utils/schema-helpers';
import { locations } from './locations.schema';
import { stations } from './stations.schema';
import { orderStatusEnum } from './enums';

export const orderStages = pgTable(
  'order_stages',
  {
    id: primaryId(),
    name: text('name').notNull(),
    sequence: integer('sequence').notNull(),
    warning_threshold_minutes: integer('warning_threshold_minutes')
      .notNull()
      .default(5),
    critical_threshold_minutes: integer('critical_threshold_minutes')
      .notNull()
      .default(8),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => locations.id),
    ...timestamps(),
  },
  (table) => [
    index('idx_order_stages_tenant_id').on(table.tenant_id),
    unique('order_stages_tenant_sequence_unique').on(
      table.tenant_id,
      table.sequence,
    ),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: primaryId(),
    order_number: text('order_number').notNull(),
    status: orderStatusEnum('status').notNull().default('received'),
    tracking_token: text('tracking_token'),
    tracking_token_expires_at: timestamp('tracking_token_expires_at', {
      withTimezone: true,
    }),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => locations.id),
    ...timestamps(),
  },
  (table) => [
    index('idx_orders_tenant_id').on(table.tenant_id),
    index('idx_orders_tenant_id_status').on(table.tenant_id, table.status),
    index('idx_orders_tracking_token').on(table.tracking_token),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: primaryId(),
    order_id: text('order_id')
      .notNull()
      .references(() => orders.id),
    item_name: text('item_name').notNull(),
    station_id: text('station_id')
      .notNull()
      .references(() => stations.id),
    stage: orderStatusEnum('stage').notNull().default('received'),
    quantity: integer('quantity').notNull().default(1),
    stage_entered_at: timestamp('stage_entered_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => locations.id),
    ...timestamps(),
  },
  (table) => [
    index('idx_order_items_order_id').on(table.order_id),
    index('idx_order_items_station_id').on(table.station_id),
    index('idx_order_items_tenant_id').on(table.tenant_id),
  ],
);
