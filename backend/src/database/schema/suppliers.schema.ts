import {
  pgTable,
  pgEnum,
  text,
  jsonb,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { primaryId, timestamps } from '../utils/schema-helpers';
import { locations } from './locations.schema';

export const supplierOrderStatusEnum = pgEnum('supplier_order_status', [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
]);

// Cross-tenant - no tenant_id
export const suppliers = pgTable('suppliers', {
  id: primaryId(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  password_hash: text('password_hash'), // for portal auth
  webhook_url: text('webhook_url'), // for enterprise API integration
  ...timestamps(),
});

export const supplierRestaurantLinks = pgTable(
  'supplier_restaurant_links',
  {
    id: primaryId(),
    supplier_id: text('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    location_id: text('location_id')
      .notNull()
      .references(() => locations.id),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('idx_supplier_links_supplier_id').on(table.supplier_id),
    index('idx_supplier_links_location_id').on(table.location_id),
    unique('supplier_links_unique').on(table.supplier_id, table.location_id),
  ],
);

export const supplierOrders = pgTable(
  'supplier_orders',
  {
    id: primaryId(),
    supplier_id: text('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    location_id: text('location_id')
      .notNull()
      .references(() => locations.id),
    items: jsonb('items').notNull(), // [{ itemName, quantity, reorderQuantity }]
    status: supplierOrderStatusEnum('status').notNull().default('pending'),
    deliver_by: timestamp('deliver_by', { withTimezone: true }),
    confirmed_at: timestamp('confirmed_at', { withTimezone: true }),
    shipped_at: timestamp('shipped_at', { withTimezone: true }),
    delivered_at: timestamp('delivered_at', { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index('idx_supplier_orders_supplier_id').on(table.supplier_id),
    index('idx_supplier_orders_location_id').on(table.location_id),
    index('idx_supplier_orders_status').on(table.status),
  ],
);
