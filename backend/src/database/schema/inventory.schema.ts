import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { primaryId, timestamps } from '../utils/schema-helpers';
import { locations } from './locations.schema';
import { stations } from './stations.schema';
import { users } from './users.schema';

export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: primaryId(),
    item_name: text('item_name').notNull(),
    current_quantity: integer('current_quantity').notNull().default(0),
    reorder_threshold: integer('reorder_threshold').notNull().default(0),
    reorder_quantity: integer('reorder_quantity').notNull().default(0),
    is_86d: boolean('is_86d').notNull().default(false),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => locations.id),
    ...timestamps(),
  },
  (table) => [
    index('idx_inventory_items_tenant_id').on(table.tenant_id),
    index('idx_inventory_items_is_86d').on(table.is_86d),
    unique('inventory_items_name_tenant_unique').on(
      table.item_name,
      table.tenant_id,
    ),
  ],
);

export const prepChecklists = pgTable(
  'prep_checklists',
  {
    id: primaryId(),
    station_id: text('station_id')
      .notNull()
      .references(() => stations.id),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => locations.id),
    name: text('name'),
    ...timestamps(),
  },
  (table) => [
    unique('prep_checklists_station_tenant_unique').on(
      table.station_id,
      table.tenant_id,
    ),
  ],
);

export const checklistItems = pgTable(
  'checklist_items',
  {
    id: primaryId(),
    checklist_id: text('checklist_id')
      .notNull()
      .references(() => prepChecklists.id),
    description: text('description').notNull(),
    is_completed: boolean('is_completed').notNull().default(false),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    completed_by: text('completed_by').references(() => users.id),
    ...timestamps(),
  },
  (table) => [index('idx_checklist_items_checklist_id').on(table.checklist_id)],
);
